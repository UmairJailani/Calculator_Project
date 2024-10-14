let input = document.getElementById("inputbox");
let buttons = document.querySelectorAll("button");

let string = "";
let arr = array.from(buttons);
arr.forEach((buttons) => {
  buttons.addEventlistener("click", (e) => {
    if (e.target.innerHtml == "=") {
      string = eval(string);
      input.value = string;
    }

    string + -e.target.innerHtml;
    input.value = string;
  });
});
