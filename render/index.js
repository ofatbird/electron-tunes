// --registry=https://registry.npm.taobao.org
const mongoose = require('mongoose')
const electron = require('electron')
const $ = require('jquery')
const Store = require('./model')
const { remote, clipboard } = electron

const shareStore = {
    docs: []
}

const loadContent = document.querySelector('.loading-content')
const body = document.querySelector('body')
const mainContent = document.querySelector('.main-content')
const ul = document.querySelector('ul')
const next = document.querySelector('#next')
const pText = $('.process-text')
const $tpages = $('.totalpages')
const $page = $('#page')
const $btn = $('button,#page')

const $loadingHint = $('.loading-hint')
const $copyHint = $('.copy-hint')

let totals = 0
let currentPage = 0

function connectMongo(excute) {
    // mongodb://admin:785689@cluster0-shard-00-00-koeuy.mongodb.net:27017,cluster0-shard-00-01-koeuy.mongodb.net:27017,cluster0-shard-00-02-koeuy.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin
    mongoose.connect('mongodb://admin:785689@lescluster-shard-00-00-njhnj.mongodb.net:27017,lescluster-shard-00-01-njhnj.mongodb.net:27017,lescluster-shard-00-02-njhnj.mongodb.net:27017/test?ssl=true&replicaSet=lesCluster-shard-0&authSource=admin');

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

// search for localStorage
currentPage = Number(localStorage.getItem('pages'))
if (currentPage === null) {
    currentPage = 0
}


pText.text('正在链接服务器...')
const vm = new window.Vue({
    el: '#container',
    data: {
        docs: []
    }
})

connectMongo(function (db) {
    const win = remote.getCurrentWindow()
    pText.text('正在获取资源...')
    getBundles(currentPage).then((res) => {
        composeResource(res)
        $page.get(0).value = currentPage + 1
        body.removeChild(loadContent)
    })
    win.on('closed', function () {
        db.close()
    })
    $('#prev').on('click', function () {
        if (!currentPage) reutrn
        $loadingHint.removeClass('hidden')
        $btn.prop('disabled', true)
        currentPage--
        getBundles(currentPage * 15).then((res) => {
            vm.docs.length = 0
            composeResource(res)
            $page.get(0).value = (currentPage + 1)
            setValue()
        })
    })
    next.addEventListener('click', function (e) {
        if (currentPage + 1 > totals) return
        const self = this
        $loadingHint.removeClass('hidden')
        $btn.prop('disabled', true)
        currentPage++
        getBundles(currentPage * 15).then((res) => {
            console.log('fetched')
            vm.docs.length = 0
            composeResource(res)
            $page.get(0).value = (currentPage + 1)
            setValue()
        })
    })
    $page.on('keyup', e => {
        if (e.keyCode !== 13) return
        const page = Number($page.get(0).value)
        if (!isNaN(page) && page <= totals && page > 0) {
            $loadingHint.removeClass('hidden')
            $btn.prop('disabled', true)
            getBundles((page - 1) * 15).then((res) => {
                vm.docs.length = 0
                composeResource(res)
                currentPage = page - 1;
                setValue()
            })
        }
    })
})

function getBundles(offset) {
    return new Promise((resolve, reject) => {
        Store.paginate({}, { sort: '-insertDate', offset, limit: 15 }, function (err, result) {
            if (err) { reject(err) } else { resolve(result) }
        })
    })
}

function composeResource(res) {
    // 检测页数 
    const tmpPages = res.total / 15
    if (totals !== tmpPages) {
        totals = tmpPages
        $tpages.text(`共${Math.ceil(totals)}頁`)
    }
    // 
    res.docs.forEach(element => {
        const $body = $(element.info)
        const p = $body.find("p")
        const star = $body.find('.star-name>a')
        let htmlStr = ''
        element.info = ''
        for (let i = 0; i < 3; i++) {
            element.info += p[i].outerHTML.replace(/style=\"[\s\S]*?\"/ig, '')
        }
        if (star.length) {
            star.each((index, ele) => { htmlStr += `<span> ${ele.innerHTML} </span>` })
        } else {
            htmlStr = ` <span> 未知 </span>`
        }
        element.info += `<p><span>演員:</span>${htmlStr}</p>`
        element.magnet = element.magnet.replace(/&apos;/g, `'`).replace(/window\.open\(\'([\s\S]*?)\',\'_self\'\)/ig, function (matched, $1) { return `copyText('${$1}')` })
        // console.log(element.magnet)
        vm.docs.push(element)
    });
}

function setValue() {
    localStorage.setItem('pages', currentPage)
    $btn.prop('disabled', false)
    $loadingHint.addClass('hidden')
    window.scroll(0, 0);
}

window.copyText = function copyText(text) {
    clipboard.writeText(unescape(text))
    $copyHint.removeClass('hidden')
    setTimeout(() => {
        $copyHint.addClass('hidden')
    }, 1500)
}

