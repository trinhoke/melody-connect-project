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

        $("#add-audio-files").onchange = function (e) {
            _this.audioFiles = [..._this.audioFiles, ...e.target.files];
            _this.showContainerAudioFiles();
            _this.showContentContainer();
        }

        $(".btn-submit").onclick = function () {
            if (!isAuthenticated) {
                return
            }
            _this.createNewPost()
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
                                    <label for='add-audio-files' class='btn-add-audio'>Thêm audio</label>
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
        if (!this.content && this.audioFiles.length == 0) {
            return
        }
        const formData = new FormData();
        formData.append('content', this.content);
        if (this.audioFiles.length > 0) {
            this.audioFiles.forEach(e => {
                formData.append('audioFiles', e)
            })
        }

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
                const post = ` <div class="post shadow"  data-id = ${data.post.id}>
                                <div class="header-post">
                                    <div class="avatar">
                                        <img src="https://yt3.ggpht.com/H_spDtAzuKhbWLEFZo66W5uHSG-uKY-Uhv5wCns_4jMNNi36cNz2xzmsBdcfx3mhzS3vKx_4=s48-c-k-c0x00ffffff-no-rj"
                                            alt="avatar" />
                                    </div>
                                    <div class="post-info">
                                        <div class="author-name">
                                            ${data.post.author}
                                        </div>
                                        <div class="time-created">
                                            ${data.post.created_at}
                                        </div>
                                    </div>
                                </div>
                                <div class="content-post">
                                    <div class="content">
                                        ${data.post.content}
                                    </div>
                                    <div>
                                        ${audios.join('')}
                                    </div>
                                    <div class="comment-post">
                                        <div class="btn-show-comment">${data.post.comments_count} Comment</div>
                                    </div>
                                </div>
                            </div>
                    `
                container.insertAdjacentHTML('afterbegin', post);
                createToast('success', 'Tạo bài viết mới thành công')
                this.resetModel()
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
            return `
                    <div class="post shadow" data-id = ${e.id}>
                        <div class="header-post">
                            <div class="avatar">
                                <img src="https://yt3.ggpht.com/H_spDtAzuKhbWLEFZo66W5uHSG-uKY-Uhv5wCns_4jMNNi36cNz2xzmsBdcfx3mhzS3vKx_4=s48-c-k-c0x00ffffff-no-rj"
                                    alt="avatar" />
                            </div>
                            <div class="post-info">
                                <div class="author-name">
                                    ${e.author}
                                </div>
                                <div class="time-created">
                                    ${e.created_at}
                                </div>
                            </div>
                        </div>
                        <div class="content-post">
                            <div class="content">
                                ${e.content}
                            </div>
                            <div>
                                ${audios.join('')}
                            </div>
                            <div class="comment-post">
                                <div class="btn-show-comment">${e.comments_count} Comment</div>
                            </div>
                        </div>
                    </div>
            `
        })
        container.innerHTML = post.join('')
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
                    _this.bindEvents();  // Gọi hàm bindEvents sau khi model được hiển thị
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
        if (inputComment) {  // Kiểm tra xem phần tử input-comment có tồn tại không
            inputComment.oninput = function (e) {
                if (isAuthenticated) {
                    const value = e.target.value.trim();
                    if (value || _this.comment.length > 0) {
                        _this.comment = value;
                    }
                    else {
                        this.value = ''
                    }
                    _this.animationIconSender();
                    _this.updatePaddingListComment();
                }
                else {
                    this.value = ''
                    createToast('error', 'Vui lòng đăng nhập để thực hiện chức năng này')
                }
            };
        }

        const iconSender = document.querySelector('.icon-sender');
        if (iconSender) {  // Kiểm tra xem phần tử icon-sender có tồn tại không
            iconSender.onclick = function () {
                if (!isAuthenticated) {
                    createToast('error', 'Vui lòng đăng nhập để thực hiện chức năng này')
                    return
                }
                if (!_this.comment || !_this.postId) {
                    createToast('error', 'Vui lòng nhập comment')
                    return;
                }
                _this.commentPost();
            };
        }
    },

    showModelComment: function () {
        if (this.isShowModelComment) {
            document.querySelector(".comment-post-model").classList.remove('hidden');
        } else {
            document.querySelector(".comment-post-model").innerHTML = '';
            document.querySelector(".comment-post-model").classList.add('hidden');
        }
    },

    updatePaddingListComment: function () {
        const x = document.querySelector(".box-sender-comment").offsetHeight;
        document.querySelector(".list-comment").style.paddingBottom = x + 10 + "px";
    },

    getPost: async function () {
        try {
            const response = await fetch(`get_post/${this.postId}`);
            const data = await response.json();

            const post = data.post;

            const audios = post.audio_files.map(e => {
                return `
                    <audio controls>
                        <source src=${e.file_url} type="audio/mpeg">
                        Your browser does not support the audio element.
                    </audio>
                `;
            });

            const comments = post.comments.map(e => {
                return `
                    <div class="comment-item" comment-id=${e.id}>
                        <div class="avatar">
                            <img src="https://yt3.ggpht.com/H_spDtAzuKhbWLEFZo66W5uHSG-uKY-Uhv5wCns_4jMNNi36cNz2xzmsBdcfx3mhzS3vKx_4=s48-c-k-c0x00ffffff-no-rj"
                                alt="avatar" />
                        </div>
                        <div class="comment-data">
                            <div class="content-comment-box">
                                <div class="username-comment">
                                    ${e.author}
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
                            Bài viết của ${post.author}
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
                                    <img src="https://yt3.ggpht.com/H_spDtAzuKhbWLEFZo66W5uHSG-uKY-Uhv5wCns_4jMNNi36cNz2xzmsBdcfx3mhzS3vKx_4=s48-c-k-c0x00ffffff-no-rj"
                                        alt="avatar" />
                                </div>
                                <div class="post-info">
                                    <div class="author-name">
                                        ${post.author}
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
                                <div>
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

        } catch (error) {
            console.log(error);
        }
    },

    animationIconSender: function () {
        if (this.comment.length == 0) {
            document.querySelector(".icon-sender").style.color = 'black';
        } else {
            document.querySelector(".icon-sender").style.color = '#0866ff';
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
                const comment = `
                    <div class="comment-item" comment-id=${data.comment.id}>
                        <div class="avatar">
                            <img src="https://yt3.ggpht.com/H_spDtAzuKhbWLEFZo66W5uHSG-uKY-Uhv5wCns_4jMNNi36cNz2xzmsBdcfx3mhzS3vKx_4=s48-c-k-c0x00ffffff-no-rj"
                                alt="avatar" />
                        </div>
                        <div class='comment-data'>
                            <div class="content-comment-box">
                                <div class="username-comment">
                                    ${data.comment.author}
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

                document.querySelector('.list-comment').insertAdjacentHTML('afterbegin', comment);
                _this.updateLengthComment();
                _this.resetInput();
            }
        } catch (error) {
            console.log(error);
        }
    },

    resetInput: function () {
        this.comment = '';
        document.querySelector(".input-comment").value = '';
        this.animationIconSender();
    },

    updateLengthComment: function () {
        const comments_count = document.querySelector('.list-comment').querySelectorAll('.comment-item').length;
        document.querySelector('.model-comment-post-container').querySelector('.comment-post').innerHTML = comments_count + " comment";
        document.querySelector(`div.post[data-id="${this.postId}"]`).querySelector('.btn-show-comment').innerHTML = comments_count + " Comment";
    },

    start: function () {
        this.handleEvent();
    }
};
commentPost.start();







