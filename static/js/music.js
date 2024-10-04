document.addEventListener('DOMContentLoaded', function() {
    var audio = document.getElementById('audio-player');
    var playButton = document.querySelector('.play-button');
    var pauseButton = document.querySelector('.pause-button');
    var progressBar = document.querySelector('.progress');
    var progressBarContainer = document.querySelector('.progress-bar');
    var currentTimeSpan = document.querySelector('.current-time');
    var totalTimeSpan = document.querySelector('.total-time');
    var isDragging = false;
    var volumeSlider = document.querySelector('.volume-slider');
    var replayButton = document.querySelector('.replay-button');
    var autoReplayButton = document.querySelector('.auto-replay-button');
    var isAutoReplayEnabled = false;

    if(audio){
        const songSlug = audio.dataset.slug;
        const minPlayDuration = parseInt(audio.dataset.minPlayDuration, 10);

    }

    let playStartTime = 0;
    let totalPlayTime = 0;
    let hasIncrementedPlay = false;
    let isPlaying = false;

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
        playButton.style.display = 'none';
        pauseButton.style.display = 'block';
        startPlayTimer();
    });

    pauseButton.addEventListener('click', function() {
        audio.pause();
        playButton.style.display = 'block';
        pauseButton.style.display = 'none';
        stopPlayTimer();
        incrementPlayCount();
    });


    audio.play();
    

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
    
});
