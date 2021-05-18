function toggleFullScreen(e) {
    if (!document.fullscreenElement) {
        e.currentTarget.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}


$(document).on("dblclick", '.canvas-wrapper', toggleFullScreen);