document.getElementById("agreeBtn").addEventListener("click", function() {
  window.location.href = "instructions.html"; // redireciona para a próxima etapa
});

document.getElementById("disagreeBtn").addEventListener("click", function() {
  alert("You have chosen not to participate in the experiment. Thank you!");
});
