// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const base64 = require('base-64')

const btn = document.querySelector('#start')
const text = document.querySelector('#text')
const input = document.querySelector('#input')

btn.addEventListener('click', () => {
  text.innerHTML = base64.encode(input.value)
})