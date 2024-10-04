document.addEventListener('DOMContentLoaded', function() {
    // Xử lý sự kiện follow
    const followBtn = document.getElementById('follow-btn');
    const followerCount = document.getElementById('follower-count');
    if (followBtn) {
        followBtn.addEventListener('click', function() {
            const artistSlug = this.dataset.artistSlug;
            fetch(`/music/artists/${artistSlug}/toggle-follow/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin'
            })
            .then(response => response.json())
            .then(data => {
                if (data.is_following) {
                    followBtn.textContent = 'Đang theo dõi';
                    followBtn.classList.add('following');
                } else {
                    followBtn.textContent = 'Theo dõi';
                    followBtn.classList.remove('following');
                }
                followerCount.textContent = data.follower_count;
            })
            .catch(error => console.error('Error:', error));
        });
    }

// Hàm lấy CSRF token từ cookie
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
});