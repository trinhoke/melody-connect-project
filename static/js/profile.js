document.addEventListener("DOMContentLoaded", function () {
    const sendRequestBtn = document.querySelector('.friend-btn.add-friend')

    if (sendRequestBtn) {
        sendRequestBtn.onclick = async function () {
            const receiverId = this.getAttribute("data-user-id");
            const data = await sendFriendRequest(receiverId);
            if (data.errCode === 0) {
                createToast("success", "Gửi lời mời kết bạn thành công!");
            } else {
                createToast("error", data.message || "Gửi lời mời kết bạn không thành công!");
            }
        }
    }


    async function sendFriendRequest(receiverId) {
        try {
            const response = await fetch(`/chat/send_friend_request/${receiverId}/`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/user/login/';
                    return { errCode: 1, message: 'Unauthorized' };
                }
                throw new Error('Network response was not ok');
            }

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return await response.json();
            } else {
                throw new Error("Received non-JSON response from server");
            }
        } catch (error) {
            console.error('Error:', error);
            return { errCode: 1, message: error.message };
        }
    }
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


})
