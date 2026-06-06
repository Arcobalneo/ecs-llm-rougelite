import "./styles.css";
import { createHomeExperience } from "./home.js";

const root = document.querySelector("#app");

if (!root) {
  throw new Error("Missing #app root");
}

createHomeExperience({ root });
