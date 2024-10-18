const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const btnShowModel = $(".show-model-create-post");
const btnCloseModel = $(".btn-close-model");
const createPostModel = $(".create-post-model");

// create toast

const toastsIcon = {
    success: {
        icon: '<i class="fas fa-check-circle"></i>',
    },
    error: {
        icon: '<i class="fas fa-exclamation-triangle"></i>',
    },
    warning: {
        icon: '<i class="fas fa-exclamation-circle"></i>',
    },
}

//toast
function createToast(status, mess) {
    let toast = document.createElement('div')
    toast.className = `toast ${status}`

    toast.innerHTML = `
    ${toastsIcon[status].icon}
    <span class="msg">${mess}</span>
    <span class="countdown"></span>
    `
    document.querySelector('#toasts').appendChild(toast)

    setTimeout(() => {
        toast.style.animation = 'hide_slide 1s ease forwards'
    }, 4000)
    setTimeout(() => {
        toast.remove()
    }, 6000)
}

// create new post

const createNewPost = {
    content: '',
    audioFiles: [],
    isShowModel: false,
    isShowAudioFiles: false,
    isOpenEdit: false,
    isOpenInputLinks: false,
    linksAudio: "",
    picker: new EmojiButton(),

    handleEvent: function () {
        const _this = this;

        btnShowModel.onclick = function () {
            if (isAuthenticated) {
                _this.isShowModel = true;
                _this.showModel();
            }
            else {
                createToast('error', 'Vui lòng đăng nhập để thực hiện chức năng này')
            }
        }

        btnCloseModel.onclick = function () {
            _this.isShowModel = false;
            _this.showModel();
        }

        $(".open-label-files").onclick = function () {
            _this.isShowAudioFiles = true;
            _this.showContainerAudioFiles();
        }

        $(".btn-close-label-files").onclick = function () {
            _this.isShowAudioFiles = false;
            _this.audioFiles = [];
            _this.showContentContainer()
            _this.showContainerAudioFiles();
        }

        $(".post-content").oninput = function (e) {
            const value = e.target.value.trim();
            if (value || _this.content.length > 0) {
                _this.content = value;
            }
        }

        $("#audio-files").onchange = function (e) {
            _this.audioFiles = [...e.target.files];
            _this.showContainerAudioFiles();
            _this.showContentContainer();
        }

        $(".input-links").oninput = function (e) {
            const value = e.target.value.trim();
            if (value || _this.linksAudio.length > 0) {
                _this.linksAudio = value;
            }
        }

        $(".open-label-links").onclick = function () {
            _this.isOpenInputLinks = true
            _this.showInputLink()
        }
        $(".btn-close-links-audio").onclick = function () {
            _this.isOpenInputLinks = false
            _this.showInputLink()
        }

        $(".open-label-emoji").onclick = function () {
            _this.picker.togglePicker(this);
        }

        _this.picker.on('emoji', emoji => {
            document.querySelector('.post-content').value += emoji;
            _this.content = document.querySelector('.post-content').value
        });

        $("#add-audio-files").onchange = function (e) {
            _this.audioFiles = [..._this.audioFiles, ...e.target.files];
            _this.showContainerAudioFiles();
            _this.showContentContainer();
            if (_this.isOpenEdit) {
                _this.renderFileAudio()
            }
        }

        $(".btn-submit").onclick = function () {
            if (!isAuthenticated) {
                return
            }
            _this.createNewPost()
        }
        document.addEventListener('click', function (event) {
            if (event.target.matches('.btn-open-edit-audio')) {
                _this.isOpenEdit = true;
                _this.showModelEdit();
                _this.renderFileAudio()
            }
        });

        $(".back-form-create-post").onclick = function () {
            _this.isOpenEdit = false;
            _this.showModelEdit();
            _this.showContentContainer();
        }

        $(".input-links").oninput = async function () {
            console.log(this.value.trim());
            await _this.renderListSong(this.value.trim())
        }
    },

    renderListSong: async function (query) {
        const res = await fetch(`search_songs/?q=${query}`).then(res => res.json())
        if (res.success) {
            const songs = res.data.map((e) => {
                return `
                                 <div class="song-item">
                                    <input type="checkbox" id="song-${e.id}" value=${e.id} class="input-song-id">
                                    <label class="label-checkbox" for="song-${e.id}">
                                        <div class="img-song">
                                            <img src="${e.cover_image}" alt="img-song"/>
                                        </div>
                                        <div class="song-info">
                                            <div class="song-title">
                                                ${e.title}
                                            </div>
                                            <div class="song-artist">
                                                ${e.artist}
                                            </div>
                                        </div>
                                    </label>
                                </div>
                        `
            })

            $(".list-song").innerHTML = songs.join('')
        }
    },

    showInputLink: function () {
        if (this.isOpenInputLinks) {
            $(".links-audio").classList.remove('hidden')
        }
        else {
            $(".links-audio").classList.add('hidden')
        }
    },

    showModel: function () {
        if (this.isShowModel) {
            createPostModel.classList.remove('hidden');
        } else {
            createPostModel.classList.add('hidden');
        }
    },

    showContainerAudioFiles: function () {
        const container = $(".form-container-content-files");
        if (this.isShowAudioFiles) {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    },

    showContentContainer: function () {
        const container = $(".container-content");
        container.innerHTML = '';
        if (this.audioFiles.length > 0) {
            container.innerHTML = `
                                    ${this.audioFiles.map(file => `<div>${file.name}</div>`).join('')}
                                    <div>
                                    <label for='add-audio-files' class='btn-add-audio'>Thêm audio</label>
                                    <div class='btn-open-edit-audio'>Chỉnh sửa</div>
                                    </div>
                                    `
        } else {
            container.innerHTML = `<div>
                                       <label id="label-audio" for="audio-files">
                                           <div class="label-audio-files">
                                               <div class="label-content">
                                                   <div class="item">
                                                       <i class="fa-solid fa-file-audio"></i>
                                                   </div>
                                                   <p>Thêm âm nhạc</p>
                                               </div>
                                           </div>
                                       </label>
                                   </div>`;
        }
    },

    createNewPost: async function () {
        if (!this.content) {
            createToast('warning', 'Vui lòng nhập nội dung bài viết');
            return
        }
        const formData = new FormData();
        formData.append('content', this.content);
        if (this.audioFiles.length > 0) {
            this.audioFiles.forEach(e => {
                formData.append('audioFiles', e)
            })
        }
        
        $$(".input-song-id").forEach((e)=>{
            if(e.checked){
                console.log(e.value);
                formData.append('music_links', e.value)
            }
        })

        try {
            const response = await fetch("/blog/createNewPost", {
                method: "POST",
                body: formData,
                headers: {
                    "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value
                }
            });

            const data = await response.json();
            if (data.success) {
                const container = $(".main-container")
                const audios = data.post.audio_files.map(e => {
                    return `
                    <audio controls>
                        <source src=${e.file_url} type="audio/mpeg">
                        Your browser does not support the audio element.
                    </audio>
                    `
                })
                const links = data.post.music_links.map(e => {
                    return `
                        <div class="song-item">
                                    <audio controls hidden>
                                        <source src=${e.url} type="audio/mpeg">
                                        Your browser does not support the audio element.
                                    </audio>
                                    <div class="div-checkbox">
                                        <div class="img-song">
                                            <img src="${e.cover_image}" alt="img-song"/>
                                        </div>
                                        <div class="song-info">
                                            <div class="song-title">
                                                ${e.title}
                                            </div>
                                            <div class="song-artist">
                                                ${e.artist}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                    `
                })
                const post = ` <div class="post shadow"  data-id = ${data.post.id}>
                                <div class="header-post">
                                    <a href="/user/profile/${data.post.author.username}">
                                        <div class="avatar">
                                            <img src="${data.post.author.avatar}"
                                                alt="avatar" />
                                        </div>
                                        <div class="post-info">
                                            <div class="author-name">
                                                ${data.post.author.username}
                                            </div>
                                            <div class="time-created">
                                                ${data.post.created_at}
                                            </div>
                                        </div>
                                    </a>
                                </div>   
                                <div class="content-post">
                                    <div class="content">
                                        ${data.post.content}
                                    </div>
                                    <div class="list-links">
                                            ${links.join('')}
                                    </div>
                                    <div class="list-audios">
                                            ${audios.join('')}
                                    </div>
                                    <div class="comment-post">
                                        <div class="comments-count">${data.post.comments_count} Comment</div>
                                    </div>
                                    <div class="btn-show-comment">
                                        Show comment
                                    </div>
                                </div>
                            </div>
                    `
                container.insertAdjacentHTML('afterbegin', post);
                createToast('success', 'Tạo bài viết mới thành công')
                this.resetModel()
                playAudio()
            } else {
                createToast('error', data.message)
            }
        } catch (error) {
            console.log(error);
        }
    },

    resetModel: function () {
        $(".post-content").value = ''
        this.audioFiles = []
        this.isShowModel = false
        this.isShowAudioFiles = false
        this.showContentContainer()
        this.showContainerAudioFiles();
        this.showModel();
    },

    renderFileAudio: function () {
        const _this = this
        if (this.audioFiles.length == 0) {
            $('.list-audio-edit').innerHTML = ''
            return
        }
        const listItem = this.audioFiles.map((e) => {
            return `
                    <div class="audio-item-edit">
                        <div class="file-audio-edit">
                            <audio src="${URL.createObjectURL(e)}" controls></audio>
                        </div>
                        <div>${e.name}</div>
                        <div class="description-audio">
                            <textarea class="description-content" placeholder="Chú thích"></textarea>
                        </div>
                        <div class="delete-audio-file">
                            <i class="fa-solid fa-xmark"></i>
                        </div>
                    </div>
                    `
        })
        $('.list-audio-edit').innerHTML = listItem.join('')
        $$(".delete-audio-file").forEach((e, idx) => {
            e.onclick = function () {
                _this.audioFiles.splice(idx, 1)
                _this.renderFileAudio()
            }
        })
    },

    showModelEdit: function () {
        if (this.isOpenEdit) {
            $(".form-create-post").classList.remove('animation-show')
            $(".form-create-post").classList.add('animation-hidden')
            $(".form-edit-auido").classList.remove('animation-hidden')
            $(".form-edit-auido").classList.add('animation-show')
        }
        else {
            $(".form-create-post").classList.remove('animation-hidden')
            $(".form-create-post").classList.add('animation-show')
            $(".form-edit-auido").classList.remove('animation-show')
            $(".form-edit-auido").classList.add('animation-hidden')
        }
    },

    start: function () {
        this.handleEvent();
    }
}
createNewPost.start();

// get post

const getPost = {
    id: 'all',
    page: 1,
    limit: 5,
    hasMore: true,
    loading: false,
    data: [],

    handleEvent: function () {
        const _this = this
        document.addEventListener('scroll', function () {
            _this.loadPost();
        })
    },

    loadPost: async function () {
        const scrollTop = window.scrollY || window.pageYOffset;
        const scrollHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        if (scrollTop + windowHeight >= scrollHeight - 100) {
            if (!this.loading && this.hasMore) {
                this.page++;
                this.loading = true;
                await this.getPost().then(() => {
                    this.showPost();
                    this.loading = false;
                }).catch(() => {
                    this.loading = false;
                });
            }
        }
    },

    showPost: function () {
        const container = $(".main-container")
        const post = this.data.map((e) => {
            const audios = e.audio_files.map(e => {
                return `
                <audio controls>
                    <source src=${e.file_url} type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>
                `
            })
            const links = e.music_links.map(e => {
                return `
                                <div class="song-item">
                                    <audio controls hidden>
                                        <source src=${e.url} type="audio/mpeg">
                                        Your browser does not support the audio element.
                                    </audio>
                                    <div class="div-checkbox">
                                        <div class="img-song">
                                            <img src="${e.cover_image}" alt="img-song"/>
                                        </div>
                                        <div class="song-info">
                                            <div class="song-title">
                                                ${e.title}
                                            </div>
                                            <div class="song-artist">
                                                ${e.artist}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                `
            })
            return `
                    <div class="post shadow" data-id = ${e.id}>
                        <div class="header-post">
                        <a href="/user/profile/${e.author.username}">
                            <div class="avatar">
                                    <img src="${e.author.avatar}"
                                        alt="avatar" />
                                </div>
                            </a>
                            <div class="post-info">
                            <a href="/user/profile/${e.author.username}">
                                <div class="author-name">
                                    ${e.author.username}
                                </div>
                            </a>
                                <div class="time-created">
                                    ${e.created_at}
                                </div>
                            </div>
                        </div>
                        <div class="content-post">
                            <div class="content">
                                ${e.content}
                            </div>
                            <div class="list-links">
                                ${links.join('')}
                            </div>
                            <div class="list-audios">
                                ${audios.join('')}
                            </div>
                            <div class="comment-post">
                                <div class="comments-count">${e.comments_count} Comment</div>
                            </div>
                            <div class="btn-show-comment">
                                Show comment
                            </div>
                        </div>
                    </div>
            `
        })
        container.innerHTML = post.join('')
        playAudio()
    },

    getPost: async function () {
        try {
            const response = await fetch(`id=all/page=${this.page}`)
            const data = await response.json()
            if (data.posts.length < this.limit) {
                this.hasMore = false
            }
            this.data = [...this.data, ...data.posts]
        } catch (error) {
            console.log(error);
        }
    },

    showLoading: function () {
        if (this.loading) {
            loadingPostElement.classList.remove('hidden');
        } else {
            loadingPostElement.classList.add('hidden');
        }
    },

    start: async function () {
        await this.getPost()
        await this.loadPost()
        this.showPost()
        this.handleEvent()
    }
}
getPost.start()

// comment

const commentPost = {
    isShowModelComment: false,
    comment: '',
    postId: null,
    parentId: null,
    post: null,
    socket: null,

    handleEvent: function () {
        const _this = this;
        document.querySelector('.main-container').addEventListener('click', async function (event) {
            if (event.target.classList.contains('btn-show-comment')) {
                let postElement = event.target.closest('.post');
                if (postElement) {
                    let postId = postElement.getAttribute('data-id');
                    _this.postId = postId;
                    await _this.getPost();
                    _this.isShowModelComment = true;
                    _this.showModelComment();
                    _this.updatePaddingListComment();
                    _this.bindEvents();
                    _this.connectWebSocket() // Gọi hàm bindEvents sau khi model được hiển thị
                }
            }
        });

        document.querySelector('.comment-post-model').onclick = function (e) {
            if (e.target.classList.contains('btn-close-comment') || e.target.classList.contains('fa-xmark')) {
                _this.isShowModelComment = false;
                _this.showModelComment();
            }
        };
    },

    bindEvents: function () {
        const _this = this;
        const inputComment = document.querySelector(".input-comment");
        if (inputComment) {
            inputComment.oninput = function (e) {
                const value = e.target.value.trim();
                _this.comment = value || ''; // Cập nhật giá trị comment
                _this.animationIconSender();
                _this.updatePaddingListComment();
            };
        }

        const iconSender = document.querySelector('.icon-sender');
        if (iconSender) {
            iconSender.onclick = function () {
                if (!isAuthenticated) {
                    createToast('error', 'Vui lòng đăng nhập để thực hiện chức năng này');
                    return;
                }
                if (!_this.comment || !_this.postId) {
                    createToast('error', 'Vui lòng nhập comment');
                    return;
                }
                _this.commentPost();
            };
        }
        if (inputComment) {
            inputComment.onkeydown = function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isAuthenticated) {
                        createToast('error', 'Vui lòng đăng nhập để thực hiện chức năng này');
                        return;
                    }
                    if (!_this.comment || !_this.postId) {
                        createToast('error', 'Vui lòng nhập comment');
                        return;
                    }
                    _this.commentPost();
                }
            };
        }
    },


    showModelComment: function () {
        const commentModel = document.querySelector(".comment-post-model");
        if (this.isShowModelComment) {
            commentModel.classList.remove('hidden');
        } else {
            commentModel.innerHTML = '';
            commentModel.classList.add('hidden');
        }
    },

    updatePaddingListComment: function () {
        const boxSenderComment = document.querySelector(".box-sender-comment");
        if (boxSenderComment) {
            const x = boxSenderComment.offsetHeight;
            document.querySelector(".list-comment").style.paddingBottom = x + 10 + "px";
            console.log(x);
        }
    },

    getPost: async function () {
        try {
            const response = await fetch(`get_post/${this.postId}`);
            const data = await response.json();

            const post = data.post;

            console.log(post);


            const audios = post.audio_files.map(e => {
                return `
                    <audio controls>
                        <source src=${e.file_url} type="audio/mpeg">
                        Your browser does not support the audio element.
                    </audio>
                `;
            });

            const links = post.music_links.map(e => {
                return `
                    <div class="song-item">
                                    <audio controls hidden>
                                        <source src=${e.url} type="audio/mpeg">
                                        Your browser does not support the audio element.
                                    </audio>
                                    <div class="div-checkbox">
                                        <div class="img-song">
                                            <img src="${e.cover_image}" alt="img-song"/>
                                        </div>
                                        <div class="song-info">
                                            <div class="song-title">
                                                ${e.title}
                                            </div>
                                            <div class="song-artist">
                                                ${e.artist}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                `
            })

            const comments = post.comments.map(e => {
                return `
                    <div class="comment-item" comment-id=${e.id}>
                        <a href="/user/profile/${e.author.username}">
                        <div class="avatar">
                            <img src="${e.author.avatar}"
                                    alt="avatar" />
                        </div>
                        </a>
                        <div class="comment-data">
                            <div class="content-comment-box">
                                <div class="username-comment">
                                    ${e.author.username}
                                </div>
                                <div class="comment-content">
                                    ${e.content}
                                </div>
                            </div>
                            <div class="time-created">
                                ${e.created_at}
                            </div>
                        </div>
                    </div>
                `;
            });

            document.querySelector(".comment-post-model").innerHTML = `
                <div class="model-comment-post-container">
                    <div class="header-model">
                        <div class="header-model-title">
                            Bài viết của ${post.author.username}
                        </div>
                        <div class="btn-close-comment">
                            <i class="fa-solid fa-xmark"></i>
                        </div>
                    </div>
                    <div class="line"></div>
                    <div class="comment-post-container">
                        <div class="post">
                            <div class="header-post">
                                <div class="avatar">
                                    <img src="${post.author.avatar}"
                                        alt="avatar" />
                                </div>
                                <div class="post-info">
                                    <div class="author-name">
                                        ${post.author.username}
                                    </div>
                                    <div class="time-created">
                                        ${post.created_at}
                                    </div>
                                </div>
                            </div>
                            <div class="content-post">
                                <div class="content">
                                    ${post.content}
                                </div>
                                <div class="list-links">
                                    ${links.join('')}
                                </div>
                                <div class="list-audios">
                                    ${audios.join('')}
                                </div>
                            </div>
                            <div class="comment-post">
                                <p>${post.comments.length} comment</p>
                            </div>
                        </div>
                        <div class="line"></div>
                        <div class="list-comment">
                            ${comments.join('')}
                        </div>
                        <div class="box-sender-comment">
                            <div class="box-comment">
                                <textarea placeholder="Nhập comment..." class="input-comment" rows="2"></textarea>
                                <div class="box-sender">
                                    <div class="icon-sender">
                                        <i class="fa-solid fa-paper-plane"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            playAudio()
            this.updatePaddingListComment();
        } catch (error) {
            console.log(error);
        }
    },

    animationIconSender: function () {
        const iconSender = document.querySelector(".icon-sender");
        if (iconSender) {
            if (this.comment.length === 0) {
                iconSender.style.color = 'black';
            } else {
                iconSender.style.color = '#0866ff';
            }
        }
    },

    commentPost: async function () {
        const _this = this;
        const formData = new FormData();
        formData.append('content', this.comment);
        formData.append('post_id', this.postId);

        try {
            const response = await fetch('/blog/comment_post', {
                method: 'POST',
                body: formData,
                headers: {
                    "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value
                }
            });

            const data = await response.json();

            if (data.success) {
                this.socket.send(JSON.stringify({
                    'data': data
                }));
                _this.resetInput();
            }
        } catch (error) {
            console.log(error);
        }
    },

    connectWebSocket: function () {
        const _this = this;
        const host = window.location.hostname;
        const port = 8001;
        this.socket = new WebSocket(
            `ws://${host}:${port}/ws/comments/${this.postId}/`
        );

        this.socket.onmessage = function (e) {
            const response = JSON.parse(e.data);
            const data = response.comment;

            const comment = `
                    <div class="comment-item" comment-id=${data.comment.id}>
                    <a href="/user/profile/${data.comment.author.username}">
                        <div class="avatar">
                            <img src="${data.comment.author.avatar}"
                                alt="avatar" />
                        </div>
                        </a>
                        <div class='comment-data'>
                            <div class="content-comment-box">
                                <div class="username-comment">
                                    ${data.comment.author.username}
                                </div>
                                <div class="comment-content">
                                    ${data.comment.content}
                                </div>
                            </div>
                            <div class="time-created">
                                ${data.comment.created_at}
                            </div>
                        </div>
                    </div>
                `;
            document.querySelector(".list-comment").insertAdjacentHTML('afterbegin', comment);
            _this.updateLengthComment();
        };

        this.socket.onclose = function (e) {
            console.error('WebSocket connection closed unexpectedly');
        };
    },


    resetInput: function () {
        this.comment = '';
        document.querySelector(".input-comment").value = '';
        this.animationIconSender();
    },

    updateLengthComment: function () {
        const comments_count = document.querySelector('.list-comment').querySelectorAll('.comment-item').length;
        document.querySelector('.model-comment-post-container').querySelector('.comment-post').innerHTML = comments_count + " comment";
        document.querySelector(`div.post[data-id="${this.postId}"]`).querySelector('.comments-count').innerHTML = comments_count + " Comment";
    },

    start: function () {
        this.handleEvent();
    }
};

commentPost.start();


function playAudio() {
    $$('.div-checkbox').forEach(e => {
        e.addEventListener('click', function() {
            const parent = this.parentElement;
            const audio = parent.querySelector('audio');
            const imgSong = this.querySelector('.img-song'); // Lấy phần tử .img-song

            if (audio.paused) {
                audio.play();
                imgSong.classList.add('paused');
            } else {
                audio.pause();
                imgSong.classList.remove('paused'); 
            }
        });
    });
}




