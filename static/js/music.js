document.addEventListener('DOMContentLoaded', function() {
    let audio = document.getElementById('audio-player');
    let playButton = document.querySelector('.play-button');
    let pauseButton = document.querySelector('.pause-button');
    let progressBar = document.querySelector('.progress');
    let progressBarContainer = document.querySelector('.progress-bar');
    let currentTimeSpan = document.querySelector('.current-time');
    let totalTimeSpan = document.querySelector('.total-time');
    let isDragging = false;
    let volumeSlider = document.querySelector('.volume-slider');
    let replayButton = document.querySelector('.replay-button');
    let autoReplayButton = document.querySelector('.auto-replay-button');
    let isAutoReplayEnabled = false;
    let minPlayDuration = 0;
    let songSlug = '';

    if(audio){
        songSlug = audio.dataset.slug;
        minPlayDuration = parseInt(audio.dataset.minPlayDuration, 10);
    }

    let playStartTime = 0;
    let totalPlayTime = 0;
    let hasIncrementedPlay = false;
    let isPlaying = false;
    let animationInterval = null;

    function animateBars() {
        const bars = document.querySelectorAll('.bar');
        bars.forEach((bar) => {
            if (!isPlaying) {
                bar.style.height = '5px';
            } else {
                const height = Math.random() * 35 + 5;
                bar.style.height = `${height}px`;
            }
        });
    }

    function startAnimation() {
        isPlaying = true;
        if (!animationInterval) {
            animationInterval = setInterval(animateBars, 100);
        }
    }

    function pauseAnimation() {
        isPlaying = false;
        if (animationInterval) {
            clearInterval(animationInterval);
            animationInterval = null;
        }
        animateBars(); // Đặt các thanh về trạng thái dừng
    }

    function startPlayTimer() {
        if (!isPlaying) {
            playStartTime = Date.now();
            isPlaying = true;
        }
    }

    function stopPlayTimer() {
        if (isPlaying) {
            totalPlayTime += (Date.now() - playStartTime) / 1000; // Chuyển đổi thành giây
            playStartTime = 0;
            isPlaying = false;
        }
    }

    function incrementPlayCount() {
        if (!hasIncrementedPlay && totalPlayTime >= minPlayDuration) {
            fetch(`/music/songs/${songSlug}/play/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `play_duration=${Math.floor(totalPlayTime)}`
            })
            .then(response => response.json())
            .then(data => {
                document.getElementById('play-count').textContent = data.plays;
                hasIncrementedPlay = true;
            });
        }
    }

    playButton.addEventListener('click', function() {
        audio.play();
        startAnimation();
        playButton.style.display = 'none';
        pauseButton.style.display = 'block';
        startPlayTimer();
    });

    pauseButton.addEventListener('click', function() {
        audio.pause();
        pauseAnimation();
        playButton.style.display = 'block';
        pauseButton.style.display = 'none';
        stopPlayTimer();
        incrementPlayCount();
    });


    audio.play();
    startAnimation();
    

//Replay Song--------------------------------------------------------------------------------------------------
    replayButton.addEventListener('click', function() {
        audio.pause();
        audio.currentTime = 0;
        audio.play();
        playButton.style.display = 'none';
        pauseButton.style.display = 'block';
        totalPlayTime = 0;
        hasIncrementedPlay = false;
        startPlayTimer();
    });

//Auto Replay Song--------------------------------------------------------------------------------------------------
    autoReplayButton.addEventListener('click', function() {
        isAutoReplayEnabled = !isAutoReplayEnabled;
        this.classList.toggle('active', isAutoReplayEnabled);
        this.title = isAutoReplayEnabled ? "Tắt tự động phát lại" : "Bật tự động phát lại";
    });

    audio.addEventListener('timeupdate', function() {
        if (!isDragging) {
            var progress = (audio.currentTime / audio.duration) * 100;
            progressBar.style.width = progress + '%';
        }

        var currentMinutes = Math.floor(audio.currentTime / 60);
        var currentSeconds = Math.floor(audio.currentTime % 60);
        if (currentSeconds < 10) {
            currentSeconds = '0' + currentSeconds;
        }
        currentTimeSpan.textContent = currentMinutes + ':' + currentSeconds;

        var totalMinutes = Math.floor(audio.duration / 60);
        var totalSeconds = Math.floor(audio.duration % 60);
        if (totalSeconds < 10) {
            totalSeconds = '0' + totalSeconds;
        }
        totalTimeSpan.textContent = totalMinutes + ':' + totalSeconds;
    });

    audio.addEventListener('ended', function() {
        if (isAutoReplayEnabled) {
            audio.currentTime = 0;
            audio.play();
            startPlayTimer();
        } else {
            playButton.style.display = 'block';
            pauseButton.style.display = 'none';
            stopPlayTimer();
            incrementPlayCount();
            totalPlayTime = 0;
            hasIncrementedPlay = false;
            setTimeout(() => {
                audio.currentTime = 0;
                audio.play();
                startAnimation();
                startPlayTimer();
            }, 1000); 
        }
    });

    progressBarContainer.addEventListener('mousedown', function(event) {
        isDragging = true;
        updateProgressBar(event);
    });

    document.addEventListener('mousemove', function(event) {
        if (isDragging) {
            updateProgressBar(event);
        }
    });

    document.addEventListener('mouseup', function(event) {
        if (isDragging) {
            isDragging = false;
            updateProgressBar(event);
            audio.currentTime = (event.offsetX / progressBarContainer.offsetWidth) * audio.duration;
        }
    });

    function updateProgressBar(event) {
        var progress = (event.offsetX / progressBarContainer.offsetWidth) * 100;
        progressBar.style.width = progress + '%';
    }

    volumeSlider.addEventListener('input', function() {
        audio.volume = volumeSlider.value / 100;
    });

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

    // Xử lý sự kiện like
    const likeButton = document.querySelector('.like-button');
    if (likeButton) {
        likeButton.addEventListener('click', function() {
            const songSlug = this.dataset.songSlug;
            fetch(`/music/songs/${songSlug}/like/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            })
            .then(response => response.json())
            .then(data => {
                const likeCountElement = document.getElementById('like-count');
                likeCountElement.textContent = data.likes_count;
                if (data.is_liked) {
                    this.classList.add('liked');
                } else {
                    this.classList.remove('liked');
                }
            });
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
    const modal = document.getElementById('friendsModal');
    const btn = document.getElementById('showFriendsModal');
    const span = document.getElementsByClassName('close')[0];
    const sendRequestBtns = document.querySelectorAll('.send-request-btn');

    btn.onclick = function() {
        modal.style.display = "block";
    }

    span.onclick = function() {
        modal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
    
    sendRequestBtns.forEach(sendRequestBtn=>{
        sendRequestBtn.onclick = async function(){
            const receiverId = this.getAttribute("data-user-id")
            const data = await sendFriendRequest(receiverId)
            if(data.errCode==0){
                createToast("success","Gửi lời mời kết bạn thành công!")
            }
            else{
                createToast("error","Gửi lời mời kết bạn không thành công!")
            }
        }
    })

    async function sendFriendRequest (receiverId) {
        const res = await fetch(`http://localhost:8000/chat/send_friend_request/${receiverId}/`, { method: 'GET' })
            .then(response => response.json())
            .catch(error => console.error('Error:', error));
            return res
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
});



