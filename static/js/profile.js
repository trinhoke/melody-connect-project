const sendRequestBtn = document.querySelector('.friend-btn.add-friend')

if(sendRequestBtn){
    sendRequestBtn.onclick = async function(){
        const receiverId = this.getAttribute("data-user-id")
        await sendFriendRequest(receiverId)
    }
}

async function sendFriendRequest (receiverId) {
    await fetch(`http://localhost:8000/chat/send_friend_request/${receiverId}/`, { method: 'GET' })
        .then(response => response.json())
        .catch(error => console.error('Error:', error));
}

