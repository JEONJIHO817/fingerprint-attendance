document.addEventListener("DOMContentLoaded", () => {
    const video = document.getElementById("myVideo");
    const buttons = document.getElementById("buttons");

    // 동영상 재생 속도 설정
    video.playbackRate = 1.3; // 1.3배속 

    // 동영상 끝날 때 이벤트 처리
    const showEndEvent = () => {
        video.classList.add("blurred"); // 동영상 흐려지기
        buttons.classList.remove("hidden"); // 텍스트와 버튼 표시
        buttons.classList.add("show-buttons");
    };

    video.addEventListener("ended", showEndEvent);

    // ESC 키 눌렀을 때 동영상 종료 처리
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            video.pause(); // 동영상 중지
            video.currentTime = video.duration; // 동영상을 마지막으로 이동
            showEndEvent(); // 종료 이벤트 실행
        }
    });
});
