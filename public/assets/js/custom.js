/* Profile menu: controlled by React (Header.tsx) */

/* Timeline dropdown — IDs used in legacy HTML only; skip if missing */
(function () {
  var timelineDropdown = document.querySelector("#_timeline_drop");
  var timelineDropShowBtn = document.querySelector("#_timeline_show_drop_btn");
  if (!timelineDropShowBtn || !timelineDropdown) return;

  var isDropTimelineShow = false;
  timelineDropShowBtn.addEventListener("click", function () {
    isDropTimelineShow = !isDropTimelineShow;
    if (isDropTimelineShow) {
      timelineDropdown.classList.add("show");
    } else {
      timelineDropdown.classList.remove("show");
    }
  });
})();
