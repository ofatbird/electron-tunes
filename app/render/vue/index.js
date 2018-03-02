const mongoose = require('mongoose')
const electron = require('electron')
const IScroll = require('./iscroll')
const Store = require('./model')
const { remote, clipboard } = electron

const mainWindow = remote.getCurrentWindow()
// connect to MongoDB Atlas
function connectMongo(excute) {
    // mongodb://admin:785689@cluster0-shard-00-00-koeuy.mongodb.net:27017,cluster0-shard-00-01-koeuy.mongodb.net:27017,cluster0-shard-00-02-koeuy.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin
    mongoose.connect('mongodb://admin:785689@lescluster-shard-00-00-njhnj.mongodb.net:27017,lescluster-shard-00-01-njhnj.mongodb.net:27017,lescluster-shard-00-02-njhnj.mongodb.net:27017/test?ssl=true&replicaSet=lesCluster-shard-0&authSource=admin')
    const db = mongoose.connection
    db.on('error', (msg) => {
        console.log('Error mesage')
        console.log(msg)
    })
    db.once('open', () => {
        console.log('Connected to MongoDB')
        !!excute && excute(db)
    })
}

// fetch resource
function getBundles(offset) {
    return new Promise((resolve, reject) => {
        Store.paginate({}, { sort: '-insertDate', offset, limit: 15 }, function (err, result) {
            if (err) { reject(err) } else { resolve(result) }
        })
    })
}
// copy to clipboard 
// window.copyText = function copyText(text) {
//     clipboard.writeText(unescape(text))
// }

Vue.component('loading-component', {
    template: `<div class="loading-content">
                 <!-- <span class="process-text">{{tiptext}}</span> -->
                 <div class="spinner">
                    <div class="cube1"></div>
                    <div class="cube2"></div>
                 </div>
               </div>`,
    props: ['tiptext']
})

Vue.component('header-component', {
    template: `<div class="store-header">
                    <div class="logo-text">
                        <img src="./assets/images/logo.png">
                    </div>
                    <div class="closeBtn" @click="closeWin">
                        <img src="./assets/images/close.svg">
                    </div>
                </div>`,
    methods: {
        closeWin: function() {
            mainWindow.close()
        }
    }
})

Vue.component('list-component', {
    template: `<div class="main-content">
                   <!-- <div style="height:36px;"></div>-->
                   <div id="scroller">
                    <ul>
                        <li class="itemlist" v-for="item in items" :key="item.number">
                            <div class="top-ctn">
                                <div class="left">
                                    <img :src="item.pic" />
                                </div>
                                <div class="right" v-html="item.info"></div>
                            </div>
                            <div class="bottom-ctn">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                        <th scope="col">First</th>
                                        <th scope="col">Last</th>
                                        <th scope="col"> </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <template v-for="magnet in item.maglist">
                                        <tr>
                                            <td class="hidden">{{magnet.name}}</td>
                                            <td class="hidden">{{magnet.size}}</td>
                                            <td><button class="btn btn-success" @click="copyText(magnet.href)">复制</button></td>
                                        </tr>
                                        </template>
                                    </tbody>
                                </table>
                            </div>
                        </li>
                    </ul>
                    </div>
                   <!-- <div style="height:40px;"></div> -->
                    <div class="tiptext" v-if="isCopied">链接已拷贝</div>
                </div>`,
    props: ['docs'],
    data: function () {
        return {
            sid: null,
            propschanged: false,
            iscroll: null,
            isCopied: false,
        }
    },
    watch: {
        docs: function () {
            this.propschanged = true
        }
    },
    computed: {
        items: function () {
            return this.docs ? this.docs.map(element => {
                const parser = new DOMParser();
                const htmltag = parser.parseFromString(element.magnet, "text/html")
                const infotag = parser.parseFromString(element.info, "text/html")
                const atag = [].filter.call(htmltag.querySelectorAll('a'), (element) => {
                    return element.className.indexOf('btn') == -1
                })
                const star = [].slice.call(infotag.querySelectorAll('.star-name>a'))
                const info_p = infotag.querySelectorAll('p')
                const list = []
                let htmlstr = ''
                element.info = ''
                for (let i = 0; i < 3; i++) {
                    element.info += info_p[i].outerHTML.replace(/style=\"[\s\S]*?\"/ig, '')
                }

                if (star.length) {
                    star.forEach(ele => { htmlstr += `<span> ${ele.innerHTML} </span>` })
                } else {
                    htmlstr = ` <span> 未知 </span>`
                }
                element.info += `<p><span>演員:</span>${htmlstr}</p>`
                for (let i = 0; i < atag.length; i += 3) {
                    list.push({
                        // htmlstr: `<span class="name">${atag[i].innerText}</span><span class="size">${atag[i + 1].innerText}</span>`,
                        name: atag[i].innerText,
                        size: atag[i + 1].innerText,
                        href: unescape(atag[i].getAttribute('href')),
                        // htmlstr: `<span class="name"></span><span class="size"></span>`,
                    })
                }
                element.maglist = list
                return element
            }) : this.docs
        }
    },
    methods: {
        copyText: function (text) {
            clearTimeout(this.sid)
            clipboard.writeText(unescape(text))
            this.isCopied = true
            this.sid = setTimeout(() => {
                this.isCopied = false
            }, 900)
        }
    },
    mounted: function () {
        this.iscroll = new IScroll('.main-content', {
            // scrollbars: 'custom',
            indicators: {
                el: "#indicator",
                ignoreBoundaries: false,
                listenX: false,
                interactive: true,
                resize: true,
            },
            mouseWheel: true,
            disableMouse: true,
            disablePointer: true,
            disableTouch: true,
            // interactiveScrollbars: true,
            // shrinkScrollbars: 'scale',
        })
    },
    updated: function(...args){
        if(!this.propschanged) return
        this.propschanged = false // result in a update
        this.iscroll.refresh()
        this.iscroll.scrollTo(0, 0)
    }
})

Vue.component('footer-component', {
    template: `<footer>
                    <button id="prev" class="btn btn-primary btn-sm" style="left:20px;" @click="getPrevPageContent" v-if="prevShow">上一頁</button>
                    <button id="next" class="btn btn-primary btn-sm" style="right:20px;" @click="getNextPageContent" v-if="nextShow">下一頁</button>
                    <input id="page" type="text" v-model="value" @blur="getGivenPageContent" @keyup.enter="getGivenPageContent"> /
                    <span class="totalpages">{{totals}}</span>
                    <div class="loader-wrapper" v-if="isloading">
                        <div class="loadtiptext">
                            正在加载资源....
                        </div>
                    </div>
                </footer>`,
    props: ["currentpage", "totals"],
    data: function () {
        return {
            value: this.currentpage + 1,
            isloading: false,
        }
    },
    watch: {
        currentpage: function () {
            this.value = this.currentpage + 1
        }
    },
    computed: {
        prevShow: function () {
            return this.currentpage > 0
        },
        nextShow: function () {
            return this.currentpage + 1 < this.totals
        }
    },
    methods: {
        modify: function (resource, page) {
            this.$emit('modify', { resource, page })
        },
        getPrevPageContent: function () {
            this.isloading = true
            getBundles((this.currentgage - 1) * 15).then(resource => {
                this.isloading = false
                this.modify(resource, this.currentpage - 1)
            })
        },
        getNextPageContent: function () {
            this.isloading = true
            getBundles(this.value * 15).then(resource => {
                this.isloading = false
                this.modify(resource, this.value)
            })
        },
        getGivenPageContent: function (e) {
            const value = Number(e.target.value)
            if (isNaN(value) || value > this.totals || !value || value === this.value) return
            this.isloading = true
            getBundles((value - 1) * 15).then(resource => {
                this.isloading = false
                this.modify(resource, value - 1)
            })

        }
    }
})

Vue.component('store-component', {
    template: `<div class="store">
                 <loading-component :tiptext="tiptext" v-if="loaderShow"></loading-component>
                 <header-component></header-component>
                 <list-component :docs="resource.docs"></list-component>
                 <footer-component v-on:modify="update" :currentpage="currentPage" :totals="totalpages"></footer-component>
               </div>`,
    data: function () {
        return {
            loaderShow: true,
            currentPage: 0,
            resource: {},
            tiptext: '正在连接服务器...',
        }
    },
    beforeMount: function () {
        connectMongo(() => {
            this.tiptext = "正在加载资源..."
        })
        getBundles(0).then(resource => {
            console.log('fetched')
            // this.docs = resource.docs
            this.resource = Object.assign({}, this.resource, resource)
            mainWindow.setOpacity(0)
            setTimeout(() => { 
                this.loaderShow = false
                mainWindow.setMinimumSize(600, 700)
                mainWindow.setSize(600, 700)
                mainWindow.setResizable(true)
                mainWindow.center()
                mainWindow.setOpacity(1)
            }, 500)
        })
    },

    computed: {
        totalpages: function () {
            return Math.ceil(this.resource.total / 15)
        }
    },
    methods: {
        update: function (data) {
            this.resource = Object.assign({}, this.resource, data.resource),
                this.currentPage = data.page
        }
    }
})

// new Vue({
//     el: '#container'
// })
