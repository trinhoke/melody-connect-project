document.addEventListener('DOMContentLoaded', function() {
    const avatarInput = document.getElementById('avatar-input');
    const avatarPreview = document.getElementById('avatar-preview');
    const avatarForm = document.getElementById('avatar-form');

    avatarInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                avatarPreview.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    });

    avatarForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        fetch(this.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': formData.get('csrfmiddlewaretoken')
            }
        }).then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Ảnh đại diện đã được cập nhật thành công!');
            } else {
                alert('Có lỗi xảy ra khi cập nhật ảnh đại diện.');
            }
        });
    });
});