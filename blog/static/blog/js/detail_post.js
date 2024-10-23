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

const commentApp = {
    socket: null,
    postId: null,
    comment: "",

    handleEvent: function () {
        const _this = this
        _this.bindEvents()
    },

    bindEvents: function () {
        const _this = this;
        const inputComment = document.querySelector(".input-comment");
        if (inputComment) {
            inputComment.oninput = function (e) {
                const value = e.target.value.trim();
                _this.comment = value || ''; 
                _this.animationIconSender();
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
            inputComment.onkeydown = function (e) {
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

    getPostId: function () {
        const boxSenderComment = document.querySelector('.box-sender-comment')
        if (boxSenderComment.getAttribute('data-post-id')) {
            this.postId = boxSenderComment.getAttribute('data-post-id')
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
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                this.socket.send(JSON.stringify({
                    'data': data
                }));
                _this.resetInput();
            } else {
                createToast('error', data.message || 'Có lỗi xảy ra khi gửi bình luận');
            }
        } catch (error) {
            console.error('Error:', error);
            createToast('error', 'Có lỗi xảy ra khi gửi bình luận');
        }
    },

    updateLengthComment:function(){
        const comments= document.querySelectorAll('.comment')
        document.querySelector('.length-comment').innerHTML = `Comments (${comments?.length})`
        document.querySelector(".list-comment p").style.display = 'none'
    },

    connectWebSocket: function () {
        const _this = this;
        const host = window.location.hostname;
        const port = 8001;
        if (_this.postId) {
            this.socket = new WebSocket(
                `ws://${host}:${port}/ws/comments/${this.postId}/`
            );

            this.socket.onmessage = function (e) {
                const response = JSON.parse(e.data);
                const data = response.comment;

                const comment = `
                            <div class="comment">
                                <a href="/user/profile/${data.comment.author.username}">
                                <img src="${data.comment.author.avatar}" alt="admin" class="comment-avatar">
                                </a>
                                <div class="comment-content">
                                    <h4>${data.comment.author.username}</h4>
                                    <p>${data.comment.content}</p>
                                    <span class="comment-date"> ${data.comment.created_at}</span>
                                </div>
                            </div>
                    `;
                document.querySelector(".list-comment").insertAdjacentHTML('afterbegin', comment);
                _this.updateLengthComment();
            };

            this.socket.onclose = function (e) {
                console.error('WebSocket connection closed unexpectedly');
            };
        }
    },

    resetInput: function () {
        this.comment = '';
        document.querySelector(".input-comment").value = '';
        this.animationIconSender();
    },
    start: function () {
        this.getPostId()
        this.connectWebSocket()
        this.handleEvent()
    }
}

commentApp.start()
