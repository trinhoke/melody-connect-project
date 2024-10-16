document.addEventListener('DOMContentLoaded', function() {
    const lyricsInput = document.getElementById('lyrics-input');
    const sendButton = document.getElementById('send-lyrics');
    const aiSuggestion = document.getElementById('ai-suggestion');
    const searchResults = document.getElementById('search-results');

    sendButton.addEventListener('click', searchLyrics);
    lyricsInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchLyrics();
        }
    });

    function searchLyrics() {
        const lyrics = lyricsInput.value.trim();
        if (lyrics) {
            fetch('/music/search-by-lyrics/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: `lyrics=${encodeURIComponent(lyrics)}`
            })
            .then(response => response.json())
            .then(data => {
                if (data.ai_suggestion) {
                    aiSuggestion.innerHTML = `AI gợi ý: ${data.ai_suggestion}`;
                    aiSuggestion.style.display = 'block';
                } else {
                    aiSuggestion.style.display = 'none';
                }
                if (data.results && data.results.length > 0) {
                    displayResults(data.results);
                } else {
                    searchResults.innerHTML = '<p>Không tìm thấy bài hát nào phù hợp.</p>';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                searchResults.innerHTML = '<p>Đã xảy ra lỗi khi tìm kiếm.</p>';
            });
            lyricsInput.value = '';
        }
    }

    function displayResults(results) {
        searchResults.innerHTML = '';
        results.forEach(song => {
            const songElement = document.createElement('div');
            songElement.className = 'song-item';
            songElement.innerHTML = `
                <a href="${song.url}">
                        <img src="${song.cover_image || '/static/images/default-cover.jpg'}" alt="${song.title}">
                    <div class="song-info">
                        <h3>${song.title}</h3>
                        <p>${song.artist}</p>
                    </div>
                </a>
            `;
            searchResults.appendChild(songElement);
        });
    }

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
