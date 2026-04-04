/* Profile dropdown — only run when elements exist (feed layout) */
(function () {
  var profileDropdown = document.querySelector("#_prfoile_drop");
  var profileDropShowBtn = document.querySelector("#_profile_drop_show_btn");
  if (!profileDropShowBtn || !profileDropdown) return;

  var isDropShow = false;
  profileDropShowBtn.addEventListener("click", function () {
    isDropShow = !isDropShow;
    if (isDropShow) {
      profileDropdown.classList.add("show");
    } else {
      profileDropdown.classList.remove("show");
    }
  });
})();

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
