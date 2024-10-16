const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

function onClickOutside(element) {
    function handleClickOutside(event) {
        if (!element.contains(event.target)) {
            $(".search-result").classList.add('hidden');
            $(".icon-back").classList.add('hidden');
        }
    }
    document.addEventListener('click', handleClickOutside);
    return function removeClickOutsideListener() {
        document.removeEventListener('click', handleClickOutside);
    };
}

const chatApp = {
    isShowListRoom: true,
    content: '',
    audioFile: null,
    querySearch: '',
    searchResult: [],
    rooms: [],
    chatRoomName: '',
    roomId: '',
    typeRoom: '',
    socket: null,
    chatSocket: null,
    userIdOnline: null,
    picker: new EmojiButton(),
    handleEvent: function () {
        const _this = this;
        $(".input-mess").oninput = function (e) {
            const value = e.target.value.trim(); // Khai báo biến `value`
            if (_this.content.length > 0 || value) {
                _this.content = value;
                _this.updateIcon();
            } else {
                this.value = '';
            }
            _this.updateMaxheight();
            _this.scrollToBottom();
        };

        $(".open-label-emoji").onclick = function () {
            _this.picker.togglePicker(this);
        };

        _this.picker.on('emoji', emoji => {
            document.querySelector('.input-mess').value += emoji;
            _this.content = document.querySelector('.input-mess').value;
            _this.updateIcon();
            _this.updateMaxheight();
            _this.scrollToBottom();
        });

        $(".search-user-input").oninput = async function (e) {
            const value = e.target.value.trim();
            if (_this.querySearch.length > 0 || value) {
                _this.querySearch = value;
                _this.searchResult = await _this.searchUser(_this.querySearch);
                _this.renderResultItem();
            } else {
                this.value = '';
            }
        };

        $(".search-user-input").onfocus = () => {
            $(".search-result").classList.remove('hidden');
            $(".icon-back").classList.remove('hidden');
        };

        $(".icon-back").onclick = function () {
            $(".search-result").classList.add('hidden');
            $(".icon-back").classList.add('hidden');
        };

        onClickOutside($(".search-user"));

        $(".icon-sender").onclick = function () {
            _this.sendMessage();
        };

        $('.input-mess').onkeydown = function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                _this.sendMessage();
            }
        };


        $("#audio-file").onchange = function (e) {
            _this.audioFile = e.target.files[0];
            if (_this.audioFile) {
                $(".file-audio").style.display = 'flex';
                $(".name-file").textContent = _this.audioFile.name;
            }
        };

        $(".icon-delete-file").onclick = _this.closeAudioFile.bind(this); // Bind this for correct context
        _this.setupIconClickListener();

        $('.open-chat-rooms').onclick = async function () {
            $$('.options-item').forEach(e => e.classList.remove('active'));
            this.classList.add('active');
            this.isShowListRoom = true
            await _this.connectChatSocket();
            if (this.isShowListRoom) {
                await _this.renderRooms();
            }
        };

        $('.open-friend-request').onclick = async function () {
            $$('.options-item').forEach(e => e.classList.remove('active'));
            this.classList.add('active');
            this.isShowListRoom = false
            await _this.renderFriendRequest();
        };

        $('.open-friends').onclick = async function () {
            $$('.options-item').forEach(e => e.classList.remove('active'));
            this.classList.add('active');
            this.isShowListRoom = false
            await _this.renderFriends();
        };
    },

    closeAudioFile: function () {
        this.audioFile = null;
        $(".file-audio").style.display = 'none';
    },

    setupIconClickListener: function () {
        const _this = this;
        const icon = document.querySelector("#icon");
        const refuseIcon = document.querySelector("#refuse-icon");
        const receiverId = $(".name-room").getAttribute("user_id");

        if (icon) {
            icon.onclick = async () => {
                if (icon.classList.contains('fa-user-plus')) {
                    console.log("gửi lời mời");
                    await _this.sendFriendRequest(receiverId);
                } else if (icon.classList.contains('fa-user-xmark')) {
                    console.log('xóa lời mời');
                    await _this.cancelFriendRequest(receiverId);
                } else if (icon.classList.contains('fa-user-minus')) {
                    console.log('hủy bạn bè');
                    await _this.deleteFriendRequest(receiverId);
                } else if (icon.classList.contains('fa-user-check')) {
                    console.log('đồng ý lời mời');
                    await _this.acceptFriendRequest(receiverId);
                }
                await _this.checkFriendRequestStatus();
                _this.setupIconClickListener();
            };
        }

        if (refuseIcon) {
            refuseIcon.onclick = async () => {
                console.log("từ chối lời mời");
                await _this.refuseFriendRequest(receiverId);
                await _this.checkFriendRequestStatus();
                _this.setupIconClickListener();
            };
        }
    },

    sendMessage: async function () {
        if (this.content) {
            const formData = new FormData();
            formData.append('content', this.content);
            formData.append('id', this.roomId);
            formData.append('type_room', this.typeRoom);
            formData.append('audioFile', this.audioFile);

            const res = await fetch('sender_message/', {
                method: "POST",
                body: formData,
                headers: {
                    "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value || "{% csrf_token %}"
                }
            }).then(res => res.json());

            if (res.success) {
                const mess = res.data;
                this.socket.send(JSON.stringify({ 'data': mess }));
                this.resetInput();
                this.closeAudioFile();
            } else {
                console.log(res.message);
            }
        } else {
            console.log('missing parameter');
        }
    },

    scrollToBottom: function () {
        $('.list-messenger-container').scrollTop = $('.list-messenger-container').scrollHeight;
    },

    updateMaxheight: function () {
        const y = $(".box-sender-mess").offsetHeight;
        $('.list-messenger-container').style.maxHeight = `calc(100vh - 70px - ${y}px)`;
    },

    searchUser: async function (query) {
        try {
            if (query) {
                const res = await fetch(`search/?q=${query}`).then(res => res.json());
                if (res.success) {
                    return res.data;
                } else {
                    console.log(res.message);
                }
            }
        } catch (error) {
            console.log(error);
        }
    },

    renderResultItem: function () {
        const _this = this;
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
                   `;
            });
            $(".search-result").innerHTML = resultItems.join('');
        } else {
            $(".search-result").innerHTML = '<div class="notify">  </div>';
        }

        if ($$(".result-item").length > 0) {
            $$(".result-item").forEach(item => {
                item.onclick = async function () {
                    const id = this.getAttribute('key');
                    const res = await fetch(`create_or_get_room/${id}/`).then(res => res.json());
                    if (res.success) {
                        if (res.data.errCode === 0) {
                            $('.notify').classList.add('hidden');
                            const roomName = res.data.name;
                            const id = res.data.id;

                            if ($$(".room")) {
                                const idx = _this.getIndexRoom(roomName);
                                _this.resetActiveRoom();
                                if (idx !== -1) {
                                    $$(".room")[idx].classList.add('active');
                                } else {
                                    const room = `
                                <div class="room active" key=${res.data.id} name=${roomName} id=${id}>
                                <div class="avatar-receiver">
                                <img src="https://yt3.ggpht.com/LKDMK6KpGDtsV11P1opuFEwjr5U5kI5BCiNEaA_v-dgGr30wfqlFAhhAvH4_xVzIIKPnI5gU=s48-c-k-c0x00ffffff-no-rj"
                                alt="avatar" />
                                </div>
                                <div class="info">
                                <div class="name-receiver">
                                ${res.data.other_user}
                                </div>
                                <div class="mess-new"></div>
                                </div>
                                </div>
                                `;
                                    $(".list-room").insertAdjacentHTML('afterbegin', room);
                                }

                                if (id !== JSON.parse($(".content-title").getAttribute('id'))) {
                                    _this.roomId = id;
                                    _this.getRoomChat();
                                }
                            }
                        } else if (res.data.errCode === 1) {
                            $('.notify').classList.remove('hidden');
                            const responce = await fetch(`check_friend_status/${res.data.other_user.id}/`, {
                                method: 'GET'
                            }).then(response => response.json()).catch(error => console.error('Error:', error));

                            console.log(res);
                            if (responce.errCode === undefined || responce.message === 'canceled' || responce.message === 'refused') {
                                $('.notify').innerHTML = `
                                    <div class="user">
                                        <i class="fa-solid fa-arrow-left go-back"></i>
                                        <div class="user-info">
                                            <div class="avatar-receiver">
                                                <img src='${res.data.other_user.avatar}' alt="avatar" />
                                            </div>
                                            <div>${res.data.other_user.username}</div>
                                        </div>
                                        <div class='options'>
                                            <button class="button send-friend-request-btn">Gửi lời mời kết bạn</button>
                                        </div>
                                    </div>
                                `;
                            } else if (responce.message === 'pending') {
                                $('.notify').innerHTML = `
                                <div class="user">
                                    <i class="fa-solid fa-arrow-left go-back"></i>
                                    <div class="user-info">
                                        <div class="avatar-receiver">
                                            <img src='${res.data.other_user.avatar}' alt="avatar" />
                                        </div>
                                        <div>${res.data.other_user.username}</div>
                                    </div>
                                    <div class='options'>
                                        <button class="button delete-friend-request-btn">Xoá lời mời kết bạn</button>
                                    </div>
                                </div>
                            `;
                            }

                            $(".button").onclick = async function () {
                                if (this.classList.contains('send-friend-request-btn')) {
                                    await _this.sendFriendRequest(res.data.id);
                                    this.innerHTML = 'Xoá lời mời kết bạn';
                                    this.classList.remove('send-friend-request-btn');
                                    this.classList.add('delete-friend-request-btn');
                                } else if (this.classList.contains('delete-friend-request-btn')) {
                                    await _this.cancelFriendRequest(res.data.id);
                                    this.innerHTML = 'Gửi lời mời kết bạn';
                                    this.classList.add('send-friend-request-btn');
                                    this.classList.remove('delete-friend-request-btn');
                                }
                            };

                            $(".go-back").onclick = async function () {
                                await _this.getRoomChat();
                            }
                        }
                    }
                    $(".search-user-input").value = '';
                    _this.querySearch = '';
                    $(".search-result").innerHTML = '';
                    $(".search-result").classList.add('hidden');
                    $(".icon-back").classList.add('hidden');
                }
            });
        }
    },

    resetInput: function () {
        this.content = '';
        $('.input-mess').value = '';
        this.updateIcon();
    },

    renderRooms: async function (reload = true) {
        const _this = this;
        try {
            const res = await fetch("get_rooms/").then(res => res.json());
            if (res.success) {
                if (reload) {
                    this.roomId = res?.rooms[0]?.id;
                    this.typeRoom = res?.rooms[0]?.type;
                    await _this.getRoomChat();
                }

                const rooms = res.rooms.map((e, idx) => {
                    return `
                    <div class="room ${_this.roomId === e.id && _this.typeRoom === e.type ? 'active' : ''}" key=${e?.id} user-id=${e?.other_user_id} name=${e?.name} id=${e?.id} type=${e.type}>
                        <div class="avatar-receiver">
                            <img src="${e.avatar}" alt="avatar" />
                            <i class="fa-solid fa-circle ${e?.other_user_id == user.id || e.type == 'group' ? 'hidden' : ''}"></i>
                        </div>
                        <div class="info">
                            <div class="name-receiver">
                                ${e.name}
                            </div>
                            <div class="mess-new">
                                ${e?.mess?.length > 0 ? (e.mess[0].user.id == user.id ? "<div>Bạn: </div>" + `<div class="content-new-mess">${e.mess[0].content}</div>` : `<div class="content-new-mess">${e.mess[0].content}</div>`) : ""}
                            </div>
                        </div>
                    </div>
                    `;
                });
                $(".list-room").innerHTML = rooms.join('');
                if (_this.userIdOnline) {
                    _this.updateOnlineStatus(_this.userIdOnline)
                }
                if ($$(".room").length > 0) {
                    $$(".room").forEach(item => {
                        item.onclick = async function () {
                            $('.notify').classList.add('hidden');
                            _this.resetActiveRoom();
                            this.classList.add('active');

                            if (_this.roomId != this.getAttribute("id") || _this.typeRoom != this.getAttribute("type")) {
                                _this.roomId = this.getAttribute("id");
                                _this.typeRoom = this.getAttribute("type");
                                await _this.getRoomChat();
                            }
                        }
                    });
                }
            } else {
                console.log(res.message);
            }
        } catch (error) {
            console.log(error);
        }
    },

    renderFriendRequest: async function () {
        const _this = this;
        const res = await fetch('get_friend_requests/').then(res => res.json());
        if (res.success) {
            const data = res.data;
            const friendRequests = data.map((e) => {
                if (e.status === 'pending') {
                    return `
                        <div class="friend-request">
                            <div class="avatar">
                                <img src="${e.sender.avatar}" alt="avatar" />
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
                    `;
                } else if (e.status === 'refused') {
                    return `
                        <div class="friend-request">
                            <div class="avatar">
                                <img src="${e.sender.avatar}" alt="avatar" />
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
                    `;
                } else if (e.status === 'accepted') {
                    return `
                        <div class="friend-request">
                            <div class="avatar">
                                <img src="${e.sender.avatar}" alt="avatar" />
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
                    `;
                }
            });
            $('.list-room').innerHTML = friendRequests.join('');

            $$(".accept-request").forEach((e) => {
                e.addEventListener('click', async function () {
                    const senderId = this.getAttribute("sender_id");
                    if (senderId) {
                        await _this.acceptFriendRequest(senderId);
                        await _this.checkFriendRequestStatus();
                        await _this.renderFriendRequest();
                        _this.setupIconClickListener();
                    }
                });
            });

            $$(".refuse-request").forEach((e) => {
                e.addEventListener('click', async function () {
                    const senderId = this.getAttribute("sender_id");
                    if (senderId) {
                        await _this.refuseFriendRequest(senderId);
                        await _this.checkFriendRequestStatus();
                        await _this.renderFriendRequest();
                        _this.setupIconClickListener();
                    }
                });
            });
        }
    },

    renderFriends: async function () {
        const _this = this;
        const res = await fetch('get_friends/').then(res => res.json());
        if (res.success) {
            const data = res.data;
            const listFriends = data.map(e => {
                return `
                    <div class="friend" user_id ="${e.id}">
                        <div class="avatar">
                            <img src="${e.avatar}" alt="avatar">
                        </div>
                        <div class="friend-options">
                            <div>${e.username}</div>
                        </div>
                        <div class="delete-friend-btn" user_id ="${e.id}">Xoá</div>
                    </div>
                `;
            });
            $('.list-room').innerHTML = listFriends.join('');
            $$(".delete-friend-btn").forEach((e) => {
                e.addEventListener('click', async function () {
                    const userId = this.getAttribute('user_id');
                    await _this.deleteFriendRequest(userId);
                    await _this.renderFriends();
                });
            });
        }
    },

    resetActiveRoom: function () {
        $$(".room").forEach(item => {
            item.classList.remove('active');
        });
    },

    getIndexRoom: function (id, type) {
        const listRoom = Array.from(document.querySelectorAll(".room"));
        return listRoom.findIndex((room) => {
            return room.getAttribute('id') == id && room.getAttribute('type') == type;
        });
    },

    connectRoomChatSocket: function () {
        const _this = this;
        const host = window.location.hostname;
        const port = 8001;
        if (this.socket) {
            this.socket.close()
        }
        this.socket = new WebSocket(`ws://${host}:${port}/ws/messages/${this.roomId}/${this.typeRoom}`);

        this.socket.onmessage = function (e) {
            const response = JSON.parse(e.data);
            const data = response.message;
            const idx = _this.getIndexRoom(data.room_id, data.room_type);
            $(".list-room").prepend($$(".room")[idx]);

            $(`div.room[id="${data.room_id}"][type="${data.room_type}"]`).querySelector(".mess-new").innerHTML =
                `${data.user.id == user.id ? "<div>Bạn: </div>" + `<div class="content-new-mess">${data.content}</div>` : `<div class="content-new-mess">${data.content}</div>`}`;

            const listMessItem = $$(".messenger-item");
            const checkMessUser = listMessItem[listMessItem.length - 1];
            if (checkMessUser) {
                if (checkMessUser.getAttribute('user') == data.user.username) {
                    checkMessUser.querySelector('.avatar-messenger').classList.add('opacity');
                }
            }

            let audioFile = '';
            if (data.audioFile) {
                audioFile = `
                    <audio controls>
                        <source src="${data.audioFile}" type="audio/mpeg">
                        Trình duyệt của bạn không hỗ trợ thẻ audio.
                    </audio>
                `;
            }
            const messagesItem = `
                <div class="messenger-item ${data.user.id === JSON.parse(user.id) ? "sender" : ""}" user=${data.user.username}>
                    <div class="avatar-messenger ${data.user.id === JSON.parse(user.id) ? "opacity" : ""}">
                        <img src="${data.user.avatar}" alt="avatar">
                    </div>
                    <div class="container-mess ${data.user.id === JSON.parse(user.id) ? "sender" : ""}">
                        ${audioFile}
                        <div class="content-mess">${data.content}</div>
                    </div>
                </div>
            `;

            $('.list-messenger').insertAdjacentHTML('beforeend', messagesItem);
            _this.scrollToBottom();
        };

        this.socket.onclose = function (e) {
            console.log('WebSocket connection closed unexpectedly');
        };
    },

    getRoomChat: async function () {
        try {
            if (this.roomId && this.typeRoom) {
                $('.notify').classList.add('hidden');
                this.connectRoomChatSocket();
                this.resetInput();
                const res = await fetch(`get_room/${this.roomId}/${this.typeRoom}`).then(res => res.json());
                if (res.success) {
                    const data = res.messages;
                    const iconOnline = $('.avatar').querySelector('i');
                    if (iconOnline) {
                        if (res.room.type === 'friend') {
                            iconOnline.classList.remove('hidden');
                            $(".icon-friend").classList.remove('hidden');
                        } else {
                            iconOnline.classList.add('hidden');
                            $(".icon-friend").classList.add('hidden');
                        }
                        if (this.userIdOnline) {
                            iconOnline.classList.toggle('online', this.userIdOnline.includes(res.room.other_user_id));
                        }
                    }

                    if (data && data.length > 0) {
                        const messagesItems = data.map((e, idx) => {
                            let audioFile = '';
                            if (e.audioFile) {
                                audioFile = `
                                    <audio controls>
                                        <source src="${e.audioFile}" type="audio/mpeg">
                                        Trình duyệt của bạn không hỗ trợ thẻ audio.
                                    </audio>
                                `;
                            }
                            return `
                            <div class="messenger-item ${e.user.id === JSON.parse(user.id) ? "sender" : ""}" user=${e.user.username}>
                                <div class="avatar-messenger ${e.user.id === JSON.parse(user.id) || (data[idx + 1] && data[idx + 1].user.id == e.user.id) ? "opacity" : ""}">
                                    <img src="${e.user.avatar}"
                                    alt="avatar">
                                </div>
                               <div class="container-mess ${e.user.id === JSON.parse(user.id) ? "sender" : ""}">
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
                    $('.content-title').setAttribute('room', res.room.name);
                    $('.content-title').setAttribute('id', res.room.id);
                    $('.content-title').setAttribute("user_id", res.room.other_user_id);
                    $(".name-room").innerHTML = res.room.name;
                    $(".name-room").setAttribute("user_id", res.room.other_user_id);
                    $(".avatar").querySelector('img').src = res.room.avatar;
                    await this.checkFriendRequestStatus();
                    this.setupIconClickListener();
                    this.scrollToBottom();
                } else {
                    console.log(res);
                }
            } else {
                $('.notify').classList.remove('hidden');
                $('.notify').innerHTML = `
                    <div>Hãy kết bạn để thực hiện nhắn tin</div>
                `;
            }
        } catch (error) {
            console.log(error);
        }
    },

    updateIcon: function () {
        $(".icon-sender").style.color = this.content.length > 0 ? '#2899eb' : 'black';
    },

    sendFriendRequest: async function (receiverId) {
        await fetch(`send_friend_request/${receiverId}/`, { method: 'GET' })
            .then(response => response.json())
            .catch(error => console.error('Error:', error));
    },

    cancelFriendRequest: async function (receiverId) {
        await fetch(`cancel_friend_request/${receiverId}/`, { method: 'GET' })
            .then(response => response.json())
            .catch(error => console.error('Error:', error));
    },

    acceptFriendRequest: async function (senderId) {
        await fetch(`accept_friend_request/${senderId}/`, { method: 'GET' })
            .then(response => response.json())
            .catch(error => console.error('Error:', error));
    },

    refuseFriendRequest: async function (senderId) {
        await fetch(`refuse_friend_request/${senderId}/`, { method: 'GET' })
            .then(response => response.json())
            .catch(error => console.error('Error:', error));
    },

    deleteFriendRequest: async function (userId) {
        await fetch(`delete_friend_request/${userId}/`, { method: 'GET' })
            .then(response => response.json())
            .catch(error => console.error('Error:', error));
    },

    checkFriendRequestStatus: async function () {
        const receiverId = $(".name-room").getAttribute("user_id");
        if (receiverId !== 'undefined') {
            const res = await fetch(`check_friend_status/${receiverId}/`, { method: 'GET' })
                .then(response => response.json())
                .catch(error => console.error('Error:', error));

            this.updateIconFriend(res);
        }
    },

    updateIconFriend: function (status) {
        const iconElement = document.querySelector(".icon-friend");
        if (status?.isFriend) {
            iconElement.innerHTML = `<i id="icon" class="fa-solid fa-user-minus"></i>`;
        } else {
            if (status?.errCode === undefined) {
                iconElement.innerHTML = `<i id="icon" class="fa-solid fa-user-plus"></i>`;
            } else if (status.message === 'pending') {
                if (status?.errCode === 0) {
                    iconElement.innerHTML = `<i id="icon" class="fa-solid fa-user-xmark"></i>`;
                } else if (status.errCode === 1) {
                    iconElement.innerHTML = `<i id="icon" class="fa-solid fa-user-check"></i> <i id="refuse-icon" class="fa-solid fa-xmark"></i>`;
                }
            } else if (status.message === 'canceled' || status.message === 'refused') {
                iconElement.innerHTML = `<i id="icon" class="fa-solid fa-user-plus"></i>`;
            } else {
                iconElement.innerHTML = `<i id="icon" class="fa-solid fa-user-plus"></i>`;
            }
        }
    },

    connectChatSocket: async function () {
        const _this = this;
        const chatSocket = await new WebSocket(`ws://localhost:8001/ws/onlineCustomer/${user.id}`);
        chatSocket.onopen = function () {
            console.log('WebSocket connection opened.');
        };

        chatSocket.onmessage = function (e) {
            try {
                const data = JSON.parse(e.data);
                if (data.online_user_ids && $(".content-title")) {
                    console.log('Online User IDs:', data.online_user_ids);
                    const userIds = data.online_user_ids;
                    _this.userIdOnline = userIds;
                    const userIdChat = $(".content-title").getAttribute('user_id');
                    if (userIdChat !== 'undefined') {
                        const iconOnline = $('.avatar').querySelector('i');
                        iconOnline.classList.toggle('online', userIds.includes(JSON.parse(userIdChat)));
                    }
                    _this.updateOnlineStatus(userIds);
                } else {
                    console.log('Received message:', data.message);
                }

            } catch (error) {
                console.error('Error parsing JSON:', error);
            }
        };

        chatSocket.onclose = function () {
            console.error('Chat socket closed unexpectedly');
        };
    },

    updateOnlineStatus: function (userIds) {
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
    },
    start: async function () {
        await this.connectChatSocket();
        await this.renderRooms();
        this.handleEvent();
        this.scrollToBottom();
    }
}

const createRoomchat = {
    typeRoom: 'friend',
    nameRoom: '',
    avatarRoom: '',
    socket: null,
    handleEvent: function () {
        const _this = this;
        $(".create-room-chat-btn").onclick = async function () {
            $(".form-create-room-chat-container").classList.remove('hidden');
            await _this.renderFriends();
        };

        $(".close-form-create-chat").onclick = function () {
            $(".form-create-room-chat-container").classList.add('hidden');
        };

        $("#type-room").onchange = async function () {
            _this.typeRoom = this.value;
            _this.showOptionsTypeRoom();
            await _this.renderFriends();
        };

        $("#name-chat").onchange = function () {
            _this.nameRoom = this.value.trim();
        };

        $("#avatar-chat").onchange = function () {
            _this.avatarRoom = this.files[0];
            $(".img-avatar-chat").src = URL.createObjectURL(_this.avatarRoom);
        };

        $(".btn-submit-create-room").onclick = async function () {
            await _this.createRoom();
            $(".form-create-room-chat-container").classList.add('hidden');
        };
    },

    showOptionsTypeRoom: function () {
        if (this.typeRoom === 'group') {
            $(".room-chat-info").classList.remove('hidden');
        } else {
            $(".room-chat-info").classList.add('hidden');
        }
    },

    createSocket: function () {
        const socket = new WebSocket(`ws://localhost:8000/ws/createRoom/${user.id}`);
        socket.onmessage = function (event) {
            const data = JSON.parse(event.data);
            console.log(data);

            if (data.type === 'create_new_room') {
                console.log(`Phòng chat mới: ${data.room_name} (ID: ${data.room_id})`);
                if (chatApp.isShowListRoom) {
                    if (data.errCode === 0) {
                        chatApp.renderRooms()
                    }
                    else {
                        chatApp.renderRooms(reload = false)
                    }
                }
            }
            else if (data.type = 'new_message') {
                const new_message = data.message;
                const idx = chatApp.getIndexRoom(new_message.room_id, new_message.room_type);
                $(".list-room").prepend($$(".room")[idx]);

                $(`div.room[id="${new_message.room_id}"][type="${new_message.room_type}"]`).querySelector(".mess-new").innerHTML =
                    `${new_message.user.id == user.id ? "<div>Bạn: </div>" + `<div class="content-new-mess">${new_message.content}</div>` : `<div class="content-new-mess">${new_message.content}</div>`}`;
            }
        };
        socket.onclose = function (event) {
            console.log('WebSocket closed');
        };
    },

    createRoom: async function () {
        let formData = new FormData();
        formData.append('typeRoom', this.typeRoom);
        if (this.typeRoom === 'friend') {
            const userId = $("input[name='userId']:checked")?.id;
            if (userId) {
                formData.append('userId', userId);
            } else {
                alert("Bạn cần chọn ít nhất 1 người bạn để tạo nhóm.");
                return;
            }
        } else if (this.typeRoom === 'group') {
            formData.append("name", this.nameRoom);
            if (this.avatarRoom) {
                formData.append("avatar", this.avatarRoom);
            }

            const selectedUserIds = [];
            $$(".input-chosse-friends").forEach((e) => {
                if (e.checked) {
                    selectedUserIds.push(e.value);
                }
            });

            if (selectedUserIds.length > 1) {
                selectedUserIds.forEach((userId) => {
                    formData.append('userIds', userId);
                });
            } else {
                alert("Bạn cần chọn ít nhất 2 người bạn để tạo nhóm.");
                return;
            }
        }

        const res = await fetch("create_room/", {
            method: "POST",
            body: formData,
            headers: {
                "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value || "{% csrf_token %}"
            }
        }).then(res => res.json());

        if (res.success && chatApp.chatSocket) {
            chatApp.chatSocket.send(JSON.stringify({ 'data': res.user_ids }));
        }

    },

    renderFriends: async function () {
        const _this = this;
        const res = await fetch('get_friends/').then(res => res.json());
        if (res.success) {
            const data = res.data;
            const listFriends = data.map(e => {
                if (_this.typeRoom === 'friend') {
                    return `
                        <div class='friend-item'>
                            <input id=${e.id} type='radio' name="userId" value=${e.id} class='input-chosse-friend'/>
                            <label for=${e.id} class="friend" user_id ="${e.id}">
                                <div class="avatar">
                                    <img src="${e.avatar}" alt="avatar">
                                </div>
                                <div class="friend-options">
                                    <div>${e.username}</div>
                                </div>
                            </label>
                        </div>
                    `;
                } else {
                    return `
                        <div class='friend-item'>
                            <input id=${e.id} type='checkbox' value=${e.id} class='input-chosse-friends'/>
                            <label for=${e.id} class="friend" user_id ="${e.id}">
                                <div class="avatar">
                                    <img src="${e.avatar}" alt="avatar">
                                </div>
                                <div class="friend-options">
                                    <div>${e.username}</div>
                                </div>
                            </label>
                        </div>
                    `;
                }
            });
            $('.list-friend').innerHTML = listFriends.join('');
        }
    },

    start: function () {
        this.handleEvent();
        this.createSocket()
    }
};

if (user.id && user.username) {
    $(".notify-login").classList.add('hidden');
    chatApp.start();
    createRoomchat.start();
} else {
    $(".notify-login").classList.remove('hidden');
}
