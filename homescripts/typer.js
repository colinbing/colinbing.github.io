new TypeIt("#myTyper", {
  speed: 60,
  deleteSpeed: 40,
  loop: true,
  waitUntilVisible: true,
})
  .type("Hi, I'm Colin!")
  .pause(2000)
  .delete(6)
  .type("a Digital Marketing Specialist!")
  .pause(2000)
  .delete(31)
  .type("an AdOps Coordinator!")
  .pause(2000)
  .delete(21)
  .type("a Campaign Manager!")
  .pause(2000)
  .delete(19)
  .go();
