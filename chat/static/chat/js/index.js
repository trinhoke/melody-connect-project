const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

function onClickOutside(element) {

    function handleClickOutside(event) {
        if (!element.contains(event.target)) {
            $(".search-result").classList.add('hidden')
            $(".icon-back").classList.add('hidden')
        }
    }
    document.addEventListener('click', handleClickOutside);
    return function removeClickOutsideListener() {
        document.removeEventListener('click', handleClickOutside);
    };
}


const chatApp = {
    content: '',
    audioFile: null,
    querySearch: '',
    searchResult: [],
    rooms: [],
    chatRoomName: '',
    socket: null,
    chatSocket: null,
    userIdOnline: null,
    picker: new EmojiButton(),
    handleEvent: function () {
        const _this = this
        $(".input-mess").oninput = function (e) {
            value = e.target.value.trim()
            if (_this.content.length > 0 || value) {
                _this.content = value
                _this.updateIcon()
            }
            else {
                this.value = ''
            }
            _this.updateMaxheight()
            _this.scrollToBottom()
        }

        $(".open-label-emoji").onclick = function () {
            _this.picker.togglePicker(this);
        }

        _this.picker.on('emoji', emoji => {
            document.querySelector('.input-mess').value += emoji;
            _this.content = document.querySelector('.input-mess').value
            _this.updateIcon()
            _this.updateMaxheight()
            _this.scrollToBottom()
        });

        $(".search-user-input").oninput = async function (e) {
            value = e.target.value.trim()
            if (_this.querySearch.length > 0 || value) {
                _this.querySearch = value
                _this.searchResult = await _this.searchUser(_this.querySearch)
                _this.renderResultItem()
            }
            else {
                this.value = ''
            }
        }

        $(".search-user-input").onfocus = () => {
            $(".search-result").classList.remove('hidden')
            $(".icon-back").classList.remove('hidden')
        }
        $(".icon-back").onclick = function () {
            $(".search-result").classList.add('hidden')
            $(".icon-back").classList.add('hidden')
        }

        onClickOutside($(".search-user"), function () {
            $(".search-result").classList.add('hidden')
            $(".icon-back").classList.add('hidden')
        });

        $(".icon-sender").onclick = function () {
            _this.sendMessage()
        }

        $("#audio-file").onchange = function (e) {
            _this.audioFile = e.target.files[0];
            if (_this.audioFile) {
                $(".file-audio").style.display = 'flex';
                $(".name-file").textContent = _this.audioFile.name;
            }
        }

        $(".icon-delete-file").onclick = _this.closeAudioFile
        _this.setupIconClickListener()

        $('.open-chat-rooms').onclick = async function () {
            $$('.options-item').forEach(e => e.classList.remove('active'))
            this.classList.add('active')
            await _this.connectChatSocket()
            await _this.renderRooms()
        }

        $('.open-friend-request').onclick = async function () {
            $$('.options-item').forEach(e => e.classList.remove('active'))
            this.classList.add('active')
            await _this.renderFriendRequest()
        }
    },

    closeAudioFile: function () {
        this.audioFile = null
        $(".file-audio").style.display = 'none';
    },

    setupIconClickListener: function () {
        const _this = this
        const icon = document.querySelector("#icon");
        const refuseIcon = document.querySelector("#refuse-icon");
        const receiverId = $(".name-room").getAttribute("user_id")

        if (icon) {
            icon.onclick = async () => {
                if (icon.classList.contains('fa-user-plus')) {
                    console.log("gui loi moi");
                    await _this.sendFriendRequest(receiverId)
                } else if (icon.classList.contains('fa-user-xmark')) {
                    console.log('xoa loi moi');
                    await _this.cancelFriendRequest(receiverId)
                }
                else if (icon.classList.contains('fa-user-minus')) {
                    console.log('huy ban be');
                    await _this.deleteFriendRequest(receiverId)
                }
                else if (icon.classList.contains('fa-user-check')) {
                    console.log('dong y loi moi');
                    await _this.acceptFriendRequest(receiverId)

                }
                await _this.checkFriendRequestStatus()
                _this.setupIconClickListener()
            };
        }

        if (refuseIcon) {
            refuseIcon.onclick = async () => {
                console.log("tu choi loi moi");
                await _this.refuseFriendRequest(receiverId)
                await _this.checkFriendRequestStatus()
                _this.setupIconClickListener()
            }
        }
    },


    sendMessage: async function () {
        if (this.content) {
            const formData = new FormData()
            formData.append('content', this.content)
            formData.append('room', this.chatRoomName)
            formData.append('audioFile', this.audioFile)

            const res = await fetch('sender_message/', {
                method: "POST",
                body: formData,
                headers: {
                    "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value || "{% csrf_token %}"
                }
            }).then(res => res.json())
            if (res.success) {
                const mess = res.data
                this.socket.send(JSON.stringify({
                    'data': mess
                }));
                this.resetInput()
                this.closeAudioFile()
            }
            else {
                console.log(res.message);
            }
        }
        else {
            console.log('missing pargam');
        }
    },

    connectWebSocket: function () {
        const _this = this;
        const host = window.location.hostname;
        const port = 8001;
        this.socket = new WebSocket(
            `ws://${host}:${port}/ws/messages/${this.chatRoomName}/`
        );

        this.socket.onmessage = function (e) {
            const response = JSON.parse(e.data);
            const data = response.message;

            const idx = _this.getIndexRoom(data.room)
            console.log($$(".room")[idx]);
            $(".list-room").prepend($$(".room")[idx])

            $(`div.room[name=${data.room}]`).querySelector(".mess-new").innerHTML = `${data.user === user.username ? "<div>Bạn: </div>" + `<div class="content-new-mess">${data.content}</div>` : `<div class="content-new-mess">${data.content}</div>`}`

            const listMessItem = $$(".messenger-item")
            const checkMessUser = listMessItem[listMessItem.length - 1]
            if (checkMessUser) {
                if (checkMessUser.getAttribute('user') == data.user.username) {
                    checkMessUser.querySelector('.avatar-messenger').classList.add('opacity')
                }
            }

            let audioFile = ''

            if (data.audioFile) {
                audioFile = `
                            <audio controls>
                                <source src="${data.audioFile}" type="audio/mpeg">
                                Trình duyệt của bạn không hỗ trợ thẻ audio.
                            </audio>
                            `
            }

            const messagesItem = `
                <div class="messenger-item ${data?.user?.id === JSON.parse(user.id) ? "sender" : ""}" user=${data.user.username}>
                    <div class="avatar-messenger ${data?.user?.id === JSON.parse(user.id) ? "opacity" : ""}">
                        <img src="${data.user.avatar}"
                        alt="avatar">
                    </div>
                    <div class="container-mess ${data?.user?.id === JSON.parse(user.id) ? "sender" : ""}">
                        ${audioFile}
                        <div class="content-mess">
                            ${data.content}
                        </div>
                    </div>
                </div>
                `

            $('.list-messenger').insertAdjacentHTML('beforeend', messagesItem);
            _this.scrollToBottom()
        };

        this.socket.onclose = function (e) {
            console.error('WebSocket connection closed unexpectedly');
        };
    },

    scrollToBottom: function () {
        $('.list-messenger-container').scrollTop = $('.list-messenger-container').scrollHeight;
    },

    updateMaxheight: function () {
        const y = $(".box-sender-mess").offsetHeight
        $('.list-messenger-container').style.maxHeight = `calc(100vh - 70px - ${y}px)`
    },

    searchUser: async function (query) {
        try {
            if (query) {
                const res = await fetch(`search/?q=${query}`).then(res => res.json())
                if (res.success) {
                    return res.data
                }
                else {
                    console.log(res.messager);
                }
            }
        } catch (error) {
            console.log(error);
        }
    },

    renderResultItem: function () {
        const _this = this
        if (this.searchResult?.length > 0) {
            const resultItems = this.searchResult.map(e => {
                return `
                    <div class="result-item" key = ${e.id}>
                        <div class="avatar-receiver">
                            <img src=${e.avatar} alt="avatar" />
                        </div>
                        <div class="name-receiver">
                            ${e.username}
                        </div>
                    </div>
                   `
            })
            $(".search-result").innerHTML = resultItems.join('')
        }
        else {
            $(".search-result").innerHTML = '<div class="notify">  </div>'
        }
        if ($$(".result-item").length > 0) {
            $$(".result-item").forEach(item => {
                item.onclick = async function () {
                    const id = this.getAttribute('key')
                    const res = await fetch(`create_or_get_room/${id}/`).then(res => res.json())
                    if (res.success) {
                        if (res.data.errCode === 0) {
                            $('.notify').classList.add('hidden')
                            const roomName = res.data.name
                            if ($$(".room")) {
                                const idx = _this.getIndexRoom(roomName)
                                _this.resetActiveRoom()
                                if (idx != -1) {
                                    $$(".room")[idx].classList.add('active')
                                }
                                else {
                                    const room = `
                                <div class="room active} " key=${res.data.id} name=${roomName}>
                                <div class="avatar-receiver">
                                <img src="https://yt3.ggpht.com/LKDMK6KpGDtsV11P1opuFEwjr5U5kI5BCiNEaA_v-dgGr30wfqlFAhhAvH4_xVzIIKPnI5gU=s48-c-k-c0x00ffffff-no-rj"
                                alt="avatar" />
                                </div>
                                <div class="info">
                                <div class="name-receiver">
                                ${res.data.other_user}
                                </div>
                                <div class="mess-new">
                                
                                </div>
                                </div>
                                </div>
                                `
                                    $(".list-room").insertAdjacentHTML('afterbegin', room)
                                }
                                if (roomName !== $(".content-title").getAttribute('room')) {
                                    _this.chatRoomName = roomName
                                    _this.getRoomChat()
                                }
                            }
                        }
                        else if (res.data.errCode === 1) {
                            $('.notify').classList.remove('hidden')
                            const responce = await fetch(`check_friend_status/${res.data.other_user.id}/`, {
                                method: 'GET'
                            })
                                .then(response => response.json())
                                .catch(error => console.error('Error:', error));
                                console.log(res);
                                
                            if (responce.errCode === undefined || responce.message === 'canceled' || responce.message === 'refused') {
                                $('.notify').innerHTML = `
                                    <div class="user">
                                        <i class="fa-solid fa-arrow-left go-back"></i>
                                        <div class="user-info">
                                            <div class="avatar-receiver">
                                                <img src='${res.data.other_user.avatar}'
                                                alt="avatar" />
                                            </div>
                                            <div>${res.data.other_user.username}</div>
                                        </div>
                                        <div class='options'>
                                            <button class=" button send-friend-request-btn">Gửi lời mời kết bạn</button>
                                        </div>
                                    </div>
                                `
                            }
                            else if (responce.message === 'pending') {
                                $('.notify').innerHTML = `
                                <div class="user">
                                    <i class="fa-solid fa-arrow-left go-back"></i>
                                    <div class="user-info">
                                        <div class="avatar-receiver">
                                            <img src='${res.data.other_user.avatar}'
                                            alt="avatar" />
                                        </div>
                                        <div>${res.data.other_user.username}</div>
                                    </div>
                                    <div class='options'>
                                        <button class="button delete-friend-request-btn">Xoá lời mời kết bạn</button>
                                    </div>
                                </div>
                            `
                            }

                            $(".button").onclick = function () {
                                if (this.classList.contains('send-friend-request-btn')) {
                                    _this.sendFriendRequest(res.data.id)
                                    this.innerHTML = 'Xoá lời mời kết bạn'
                                    this.classList.remove('send-friend-request-btn')
                                    this.classList.add('delete-friend-request-btn')
                                }
                                else if (this.classList.contains('delete-friend-request-btn')) {
                                    _this.cancelFriendRequest(res.data.id)
                                    this.innerHTML = 'Gửi lời mời kết bạn'
                                    this.classList.add('send-friend-request-btn')
                                    this.classList.remove('delete-friend-request-btn')
                                }
                            }

                            $(".go-back").onclick = async function () {
                                await _this.getRoomChat()
                            }
                        }
                    }
                    $(".search-user-input").value = ''
                    _this.querySearch = ''
                    $(".search-result").innerHTML = ''
                    $(".search-result").classList.add('hidden')
                    $(".icon-back").classList.add('hidden')
                }
            })
        }
    },

    resetInput: function () {
        this.content = ''
        $('.input-mess').value = ''
        this.updateIcon()
    },

    renderRooms: async function () {
        const _this = this
        try {
            const res = await fetch("get_rooms/").then(res => res.json())
            if (res.success) {
                this.chatRoomName = res.data[0].name
                const rooms = res.data.map((e, idx) => {
                    return `
                    <div class="room ${idx == 0 ? 'active' : ''} " key=${e?.id} user-id= ${e?.other_user_id} name=${e?.name}>
                        <div class="avatar-receiver">
                            <img src="${e.other_user.avatar}"
                            alt="avatar" />
                            <i class="fa-solid fa-circle ${e?.other_user_id == user.id ? 'hidden' : ''}"></i>
                        </div>
                        <div class="info">
                            <div class="name-receiver">
                                ${e.other_user.username}
                            </div>
                            <div class="mess-new">
                                ${e.mess.length > 0 ? (e.mess[0].user.username === user.username ? "<div>Bạn: </div>" + `<div class="content-new-mess">${e.mess[0].content}</div>` : `<div class="content-new-mess">${e.mess[0].content}</div>`) : ""}
                            </div>
                        </div>
                    </div>
                    `
                })
                $(".list-room").innerHTML = rooms.join('')
                if ($$(".room").length > 0) {
                    $$(".room").forEach(item => {
                        item.onclick = async function () {
                            $('.notify').classList.add('hidden')
                            _this.resetActiveRoom()
                            this.classList.add('active')
                            if (_this.chatRoomName != this.getAttribute("name")) {
                                _this.chatRoomName = this.getAttribute("name")
                                _this.getRoomChat()
                            }
                        }
                    })
                }
            }
            else {
                console.log(res.messager);
            }
        } catch (error) {
            console.log(error);
        }
    },

    renderFriendRequest: async function () {
        const _this = this
        const res = await fetch('get_friend_requests/').then(res => res.json())
        if (res.success) {
            const data = res.data;
            console.log(data);
            const friendRequests = data.map((e, idx) => {
                if (e.status === 'pending') {
                    return `
                        <div class="friend-request">
                            <div class="avatar">
                                <img src="${e.sender.avatar}"
                                alt="avatar" />
                            </div>
                            <div class="info">
                                <div class="name">
                                    <b>${e.sender.username}</b> đã gửi cho bạn 1 lời mời kết bạn
                                </div>
                                <div class='description'>
                                    <button sender_id="${e.sender.id}" class="accept-request">Đồng ý</button>
                                    <button sender_id="${e.sender.id}" class="refuse-request">Từ chối</button>
                                </div>
                            </div>
                        </div>
                    `
                }
                else if (e.status === 'refused') {
                    return `
                        <div class="friend-request">
                            <div class="avatar">
                                <img src="${e.sender.avatar}"
                                alt="avatar" />
                            </div>
                            <div class="info">
                                <div class="name">
                                    <b>${e.sender.username}</b> đã gửi cho bạn 1 lời mời kết bạn
                                </div>
                                <div class='description'>
                                    <p>Bạn đã từ chối lời mời này</p>
                                </div>
                            </div>
                        </div>
                    `
                }
                else if (e.status === 'accepted') {
                    return `
                        <div class="friend-request">
                            <div class="avatar">
                                <img src="${e.sender.avatar}"
                                alt="avatar" />
                            </div>
                            <div class="info">
                                <div class="name">
                                    <b>${e.sender.username}</b> đã gửi cho bạn 1 lời mời kết bạn
                                </div>
                                <div class='description'>
                                    <p>Bạn đã đồng ý lời mời kết bạn</p>
                                </div>
                            </div>
                        </div>
                    `
                }
            })
            $('.list-room').innerHTML = friendRequests.join('')

            $$(".accept-request").forEach((e) => {
                e.addEventListener('click', async function () {
                    const senderId = this.getAttribute("sender_id")
                    if (senderId) {
                        await _this.acceptFriendRequest(senderId)
                        await _this.checkFriendRequestStatus()
                        await _this.renderFriendRequest()
                        _this.setupIconClickListener()
                    }
                })
            })

            $$(".refuse-request").forEach((e) => {
                e.addEventListener('click', async function () {
                    const senderId = this.getAttribute("sender_id")
                    if (senderId) {
                        await _this.refuseFriendRequest(senderId)
                        await _this.checkFriendRequestStatus()
                        await _this.renderFriendRequest()
                        _this.setupIconClickListener()
                    }
                })
            })
        }
    },

    resetActiveRoom: function () {
        $$(".room").forEach(item => {
            item.classList.remove('active')
        })
    },

    getIndexRoom: function (roomName) {
        const listRoom = Array.from($$(".room")).map((e) => {
            return e.getAttribute('name')
        })
        const idx = listRoom.findIndex((room) => room === roomName)
        return idx
    },

    getRoomChat: async function () {
        try {
            if (this.chatRoomName) {
                $('.notify').classList.add('hidden')
                this.connectWebSocket()
                this.resetInput();
                const res = await fetch(`get_room/${this.chatRoomName}`).then(res => res.json());
                if (res.success) {
                    const data = res.messages;
                    const iconOnline = $('.avatar').querySelector('i')
                    if (this.userIdOnline) {
                        if (this.userIdOnline.includes(res.room.other_user_id)) {
                            iconOnline.classList.add('online')
                        }
                        else {
                            iconOnline.classList.remove('online')
                        }
                    }

                    if (data && data.length > 0) {
                        const messagesItems = data.map((e, idx) => {
                            let audioFile = ''
                            if (e.audioFile) {
                                audioFile = `
                                <audio controls>
                                    <source src="${e.audioFile}" type="audio/mpeg">
                                    Trình duyệt của bạn không hỗ trợ thẻ audio.
                                </audio>
                                `
                            }
                            return `
                            <div class="messenger-item ${e.user.username === user.username ? "sender" : ""}" user=${e.user.username}>
                                <div class="avatar-messenger ${e.user.username === user.username || (data[idx + 1] && data[idx + 1].user == e.user) ? "opacity" : ""}">
                                    <img src="${e.user.avatar}"
                                    alt="avatar">
                                </div>
                               <div class="container-mess ${e.user.username === user.username ? "sender" : ""}">
                                    ${audioFile}
                                    <div class="content-mess">
                                        ${e.content}
                                    </div>
                               </div>
                            </div>
                            `;
                        });
                        $('.list-messenger').innerHTML = messagesItems.join('');
                    } else {
                        $('.list-messenger').innerHTML = ``;
                    }
                    $('.content-title').setAttribute('room', res.room.name)
                    $('.content-title').setAttribute("user_id", res.room.other_user_id);
                    $(".name-room").innerHTML = res.room.other_user.username;
                    $(".name-room").setAttribute("user_id", res.room.other_user_id);
                    $(".avatar").querySelector('img').src = res.room.other_user.avatar
                    await this.checkFriendRequestStatus()
                    this.setupIconClickListener()
                    this.scrollToBottom()
                } else {
                    console.log(res);
                }
            }
            else {
                $('.notify').classList.remove('hidden')
            }
        } catch (error) {
            console.log(error);
        }
    },

    updateIcon: function () {
        if (this.content.length > 0) {
            $(".icon-sender").style.color = '#2899eb'
        }
        else {
            $(".icon-sender").style.color = 'black'
        }
    },

    sendFriendRequest: async function (receiverId) {
        const res = await fetch(`send_friend_request/${receiverId}/`, {
            method: 'GET'
        })
            .then(response => response.json())
            .catch(error => console.error('Error:', error));
    },

    cancelFriendRequest: async function (receiverId) {
        const res = await fetch(`cancel_friend_request/${receiverId}/`, {
            method: 'GET'
        })
            .then(response => response.json())
            .catch(error => console.error('Error:', error));
    },

    acceptFriendRequest: async function (senderId) {
        const res = await fetch(`accept_friend_request/${senderId}/`, {
            method: 'GET'
        })
            .then(response => response.json())
            .catch(error => console.error('Error:', error));
    },

    refuseFriendRequest: async function (senderId) {
        const res = await fetch(`refuse_friend_request/${senderId}/`, {
            method: 'GET'
        })
            .then(response => response.json())
            .catch(error => console.error('Error:', error));
    },

    deleteFriendRequest: async function (userId) {
        const res = await fetch(`delete_friend_request/${userId}/`, {
            method: 'GET'
        })
            .then(response => response.json())
            .catch(error => console.error('Error:', error));
    },

    checkFriendRequestStatus: async function () {
        const receiverId = $(".name-room").getAttribute("user_id")
        if (receiverId) {
            const res = await fetch(`check_friend_status/${receiverId}/`, {
                method: 'GET'
            })
                .then(response => response.json())
                .catch(error => console.error('Error:', error));

            this.updateIconFriend(res)
        }
    },

    updateIconFriend: function (status) {
        const iconElement = document.querySelector(".icon-friend");
        if (status?.isFriend) {
            iconElement.innerHTML = `<i id="icon" class="fa-solid fa-user-minus"></i>`;
        }
        else {
            if (status.errCode === undefined) {
                iconElement.innerHTML = `<i id="icon" class="fa-solid fa-user-plus"></i>`;
            } else if (status.message === 'pending') {
                if (status.errCode === 0) {
                    iconElement.innerHTML = `<i id="icon" class="fa-solid fa-user-xmark"></i>`;
                } else if (status.errCode === 1) {
                    iconElement.innerHTML = `<i id="icon" class="fa-solid fa-user-check"></i> <i id="refuse-icon" class="fa-solid fa-xmark"></i>`;
                }
            }
            else if (status.message === 'canceled' || status.message === 'refused') {
                iconElement.innerHTML = `<i id="icon" class="fa-solid fa-user-plus"></i>`;
            }
            else {
                iconElement.innerHTML = `<i id="icon" class="fa-solid fa-user-plus"></i>`;
            }
        }
    },

    connectChatSocket: async function () {
        const _this = this
        const chatSocket = await new WebSocket(
            `ws://localhost:8001/ws/onlineCustomer/${user.id}`
        );

        chatSocket.onopen = async function (e) {
            console.log('WebSocket connection opened.');
        };

        chatSocket.onmessage = await function (e) {
            try {
                const data = JSON.parse(e.data);
                if (data.online_user_ids) {
                    console.log('Online User IDs:', data.online_user_ids);
                    const userIds = data.online_user_ids
                    _this.userIdOnline = userIds
                    userIdChat = $(".content-title").getAttribute('user_id')
                    if (userIds.includes(JSON.parse(userIdChat))) {
                        const iconOnline = $('.avatar').querySelector('i')
                        iconOnline.classList.add('online')
                    }
                    else {
                        const iconOnline = $('.avatar').querySelector('i')
                        iconOnline.classList.remove('online')
                    }
                    updateOnlineStatus(userIds)
                } else {
                    console.log('Received message:', data.message);
                }

            } catch (error) {
                console.error('Error parsing JSON:', error);
            }
        };

        chatSocket.onclose = function (e) {
            console.error('Chat socket closed unexpectedly');
        };

        function updateOnlineStatus(userIds) {
            document.querySelectorAll('div.room').forEach(e => {
                const iconOnline = e.querySelector('.avatar-receiver i');
                iconOnline.classList.remove('online');
            });
            userIds.forEach(userId => {
                const roomDiv = document.querySelector(`div.room[user-id="${userId}"]`);
                if (roomDiv) {
                    const iconOnline = roomDiv.querySelector('.avatar-receiver i');
                    iconOnline.classList.add('online');
                }
            });
        }
    },

    start: async function () {
        await this.connectChatSocket()
        await this.renderRooms()
        await this.getRoomChat()
        this.handleEvent()
        this.scrollToBottom()
    }
}



if(user.id && user.username){
    $(".notify-login").classList.add('hidden')
    chatApp.start()
}
else{
    $(".notify-login").classList.remove('hidden')
}
