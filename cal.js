let input = document.getElementById("inputbox");
let buttons = document.querySelectorAll("button");

let string = "";
let arr = Array.from(buttons);
buttons.forEach((button) => {
  button.addEventListener("click", (e) => {
    input.focus();
    if (e.target.innerHTML == "=") {
      string = string.replace(/×/g, "*").replace(/÷/g, "/");
      string = eval(string);
      input.value = string;
    } else if (e.target.innerHTML == "AC") {
      string = "";
      input.value = string;
    } else if (e.target.innerHTML == "Del") {
      string = string.slice(0, -1);
      input.value = string;
    } else if (e.target.innerHTML == "%") {
      string = eval(string) / 100;
      input.value = string;
    } else if (e.target.innerHTML == "error") {
      string = "Error";
      input.value = string;
    } else {
      if (string.length < 12) {
        string += e.target.innerHTML;
        input.value = string;
      } else {
        return;
      }
    }
  });
});
