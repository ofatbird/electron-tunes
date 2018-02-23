// inde
const mongoose = require('mongoose')
const electron = require('electron')
const Store = require('./model')
const remote = electron.remote
const TweenMax = window.TweenMax

const shareStore = {
    docs: []
}

let currentPage = 0

function connectMongo(excute) {
    mongoose.connect('mongodb://admin:785689@cluster0-shard-00-00-koeuy.mongodb.net:27017,cluster0-shard-00-01-koeuy.mongodb.net:27017,cluster0-shard-00-02-koeuy.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin');

    const db = mongoose.connection;

    db.on('error', (msg) => {
        console.log('Error mesage')
        console.log(msg)
    })

    db.once('open', () => {
        console.log('Connected to MongoDB')
        excute(db)
    })
}
const loadContent = document.querySelector('.loading-content')
const body = document.querySelector('body')
const mainContent = document.querySelector('.main-content')
const ul = document.querySelector('ul')
const next = document.querySelector('#next')
const copy = document.querySelector('#copytext')


const vm = new window.Vue({
    el: '#container',
    data: {
        docs: []
    }
})

connectMongo(function (db) {
    const win = remote.getCurrentWindow()
    getBundles(0).then((docs) => {
        docs.forEach(element => {
            const $body = $(element.info)
            const p = $body.find("p")
            const star = $body.find('.star-name>a')
            let htmlStr = ''
            element.info = ''
            for (let i = 0; i < 3; i++) {
                element.info += p[i].outerHTML.replace(/style=\"[\s\S]*?\"/ig,'')
            }
            if (star.length) {
                star.each((index, ele) => { htmlStr += `<span>${ele.innerHTML}</span>` })
            } else {
                htmlStr = `<span>未知</span>`
            }
            element.info += `<p><span>演員:</span>${htmlStr}</p>`
            element.magnet = element.magnet.replace(/window\.open\(\'([\s\S]*?)\',\'_self\'\)/ig, function (matched, $1) { return `copyText('${$1}')` })
            vm.docs.push(element)
        });
        window.stop()
        body.removeChild(loadContent)
    })
    win.on('closed', function () {
        db.close()
    })
    next.addEventListener('click', function (e) {
        const self = this
        console.log('fetching')
        this.setAttribute('disabled', true)
        currentPage++
        getBundles(currentPage * 15).then((docs) => {
            console.log('fetched')
            self.removeAttribute('disabled')
            vm.docs.length = 0
            docs.forEach((element, index) => {
                const $body = $(element.info)
                const p = $body.find("p")
                const star = $body.find('.star-name>a')
                let htmlStr = ''
                element.info = ''
                for (let i = 0; i < 3; i++) {
                    p[i].removeAttribute('style')
                    element.info += p[i].outerHTML
                }
                if (star.length) {
                    star.each((index, ele) => { htmlStr += `<span>${ele.innerHTML}</span>` })
                } else {
                    htmlStr = `<span>未知</span>`
                }
                element.info += `<p><span>演員:</span>${htmlStr}</p>`
                element.magnet = element.magnet.replace(/window\.open\(\'([\s\S]*?)\',\'_self\'\)/ig, function (matched, $1) { return `copyText('${$1}')` })
                vm.docs.push(element)
            });
        })
    })

})

function getBundles(offset) {
    return new Promise((resolve, reject) => {
        Store.paginate({}, { offset, limit: 15 }, function (err, result) {
            if (err) { reject(err) } else { resolve(result.docs) }
        })
    })
}
const $loadingHint = $('.loading-hint')
const $copyHint = $('.copy-hint')

window.copyText = function copyText(text) {
    copy.value = text
    copy.select()
    document.execCommand('copy')
    $copyHint.removeClass('hidden')
    setTimeout(() => {
        $copyHint.addClass('hidden')
    }, 1500)
}

