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

    
    audio.play();
    playButton.addEventListener('click', function() {
        audio.play();
        playButton.style.display = 'none';
        pauseButton.style.display = 'block';
    });

    pauseButton.addEventListener('click', function() {
        audio.pause();
        playButton.style.display = 'block';
        pauseButton.style.display = 'none';
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
        playButton.style.display = 'block';
        pauseButton.style.display = 'none';
        audio.currentTime = 0;  
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

});
