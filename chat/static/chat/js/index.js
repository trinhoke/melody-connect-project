console.log("hello");


const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

console.log($(".box-sender-mess"));


const comment = {
    handleEvent: function () {
        const _this = this
        $(".input-mess").oninput = function (e) {
            _this.updateMaxheight()
            _this.scrollToBottom()
        }
    },

    scrollToBottom: function () {
        $('.list-messenger-container').scrollTop = $('.list-messenger-container').scrollHeight;
    },
    updateMaxheight: function () {
        const y = $(".box-sender-mess").offsetHeight
        $('.list-messenger-container').style.maxHeight = `calc(100vh - 70px - ${y}px)`
    },

    start: function () {
        this.handleEvent()
        this.scrollToBottom()
    }
}

comment.start()
