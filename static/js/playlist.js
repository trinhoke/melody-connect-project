document.addEventListener('DOMContentLoaded', function() {
    const audioPlayer = document.getElementById('audio-player');
    const playButton = document.querySelector('.play-button');
    const pauseButton = document.querySelector('.pause-button');
    const progressBar = document.getElementById('progress-bar');
    const progress = progressBar.querySelector('.progress');
    const currentTimeSpan = document.querySelector('.current-time');
    const totalTimeSpan = document.querySelector('.total-time');
    const volumeSlider = document.querySelector('.volume-slider');
    const autoReplayButton = document.querySelector('.auto-replay-button');
    const playlistSongs = document.getElementById('playlist-songs');
    const songItems = playlistSongs.querySelectorAll('.song-item');
    const songTitle = document.querySelector('.song-title');
    const songPreview = document.querySelector('.song-preview');

    const replayButton = document.querySelector('.replay-button');
    let isAutoReplay = false;

    let currentSongIndex = 0;
    let playStartTime = 0;

    function loadSong(index) {
        const song = songItems[index];
        audioPlayer.src = song.dataset.songUrl;
        audioPlayer.dataset.slug = song.dataset.songSlug;
        songTitle.textContent = song.dataset.songTitle;
        songPreview.textContent = song.dataset.songTitle + ' - ' + song.dataset.songArtist;
        highlightCurrentSong(index);
    }

    function highlightCurrentSong(index) {
        songItems.forEach((item, i) => {
            if (i === index) {
                item.classList.add('playing');
            } else {
                item.classList.remove('playing');
            }
        });
    }

    function playSong() {
        audioPlayer.play();
        playButton.style.display = 'none';
        pauseButton.style.display = 'flex';
        playStartTime = Date.now();
    }

    function pauseSong() {
        audioPlayer.pause();
        playButton.style.display = 'flex';
        pauseButton.style.display = 'none';
    }

    function updateProgress(e) {
        const { duration, currentTime } = e.srcElement;
        const progressPercent = (currentTime / duration) * 100;
        progress.style.width = `${progressPercent}%`;

        currentTimeSpan.textContent = formatTime(currentTime);
        totalTimeSpan.textContent = formatTime(duration);
    }

    function formatTime(time) {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    function setProgress(e) {
        const width = this.clientWidth;
        const clickX = e.offsetX;
        const duration = audioPlayer.duration;
        audioPlayer.currentTime = (clickX / width) * duration;
    }

    function nextSong() {
        currentSongIndex = (currentSongIndex + 1) % songItems.length;
        loadSong(currentSongIndex);
        playSong();
    }

    function replaySong() {
        audioPlayer.currentTime = 0;
        playSong();
    }

    playButton.addEventListener('click', playSong);
    pauseButton.addEventListener('click', pauseSong);
    audioPlayer.addEventListener('timeupdate', updateProgress);
    progressBar.addEventListener('click', setProgress);

    volumeSlider.addEventListener('input', function() {
        audioPlayer.volume = this.value / 100;
    });

    autoReplayButton.addEventListener('click', function() {
        isAutoReplay = !isAutoReplay;
        this.classList.toggle('active', isAutoReplay);
    });

    replayButton.addEventListener('click', replaySong);

    audioPlayer.addEventListener('ended', function() {
        const playDuration = (Date.now() - playStartTime) / 1000;
        const minPlayDuration = parseInt(audioPlayer.dataset.minPlayDuration, 10);

        if (playDuration >= minPlayDuration) {
            fetch(`/music/increment-play-count/${audioPlayer.dataset.slug}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/json',
                },
            });
        }

        if (isAutoReplay) {
            replaySong();
        } else {
            nextSong();
        }
    });

    playlistSongs.addEventListener('click', function(e) {
        const songItem = e.target.closest('.song-item');
        if (songItem) {
            currentSongIndex = Array.from(songItems).indexOf(songItem);
            loadSong(currentSongIndex);
            playSong();
        }
    });

    // Khởi tạo bài hát đầu tiên
    loadSong(currentSongIndex);
    playSong();

  
    // Xử lý sự kiện like
    const likeButton = document.querySelector('.like-button');
    if (likeButton) {
        likeButton.addEventListener('click', function() {
            const playlistSlug = this.dataset.playlistSlug;
            fetch(`/music/playlists/${playlistSlug}/like/`, {
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
            await sendFriendRequest(receiverId)
        }
    })
});

async function sendFriendRequest (receiverId) {
    await fetch(`http://localhost:8000/chat/send_friend_request/${receiverId}/`, { method: 'GET' })
        .then(response => response.json())
        .catch(error => console.error('Error:', error));
}