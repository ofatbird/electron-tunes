const mongoose = require('mongoose')
const electron = require('electron')
// const IScroll = require('./iscroll')
const Store = require('./model')
const { remote, clipboard } = electron

let searchValue = ''
// localStorage.removeItem("currentPage")
const mainWindow = remote.getCurrentWindow()
const limits = 10
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
function getBundles(offset, query) {
    if (!query) query = { fake: false }
    else query = Object.assign(query, { fake: false })
    return new Promise((resolve, reject) => {
        Store.paginate(query, { sort: '-insertDate', offset, limit: limits }, function (err, result) {
            if (err) { reject(err) } else { resolve(result) }
        })
    })
}

Vue.component('loading-component', {
    template: `<div class="loading-content">
                 <div class="animator"></div>
                 <!-- <span class="process-text">{{tiptext}}</span> -->
                 <!--<div class="spinner">
                    <div class="cube1"></div>
                    <div class="cube2"></div>
                 </div> -->
               </div>`,
    props: ['tiptext']
})

Vue.component('header-component', {
    template: `<div class="store-header">
                    <div class="logo-text" :class="{'center-logo': !show}">
                        <img src="./assets/images/store-logo.png">
                    </div>
                    <div class="search" v-if="show">
                        <input type="text" @keyup.enter="search" placeholder="search" />
                    </div>
                    <div class="minizeBtn" @click="minizeWin">
                        <img src="./assets/images/minus.svg">
                    </div>
                    <div class="closeBtn" @click="closeWin">
                        <img src="./assets/images/close.svg">
                    </div>
                    <div class="hint-holder" v-if="search_model">
                        <div class="inner-holder">
                            <button class="back" @click="getBack">返回</button>
                            <div class="center-text">搜索到{{count}}个匹配项</div>
                        </div>
                    </div>
                    <div class="loader-wrapper" v-if="isloading">
                        <div class="loadtiptext">
                            正在加载资源....
                        </div>
                    </div>
                </div>`,
    props: ['show'],
    data: function () {
        return {
            search_model: false,
            isloading: false,
            count: 0,
        }
    },
    methods: {
        closeWin: function () {
            mainWindow.hide()
        },
        minizeWin: function () {
            mainWindow.minimize()
        },
        getBack: function () {
            const currentpage = Number(localStorage.getItem('currentPage'))
            this.isloading = true
            searchValue = ''
            getBundles(currentpage * limits).then(resource => {
                this.$emit('back', {
                    resource,
                    page: currentpage,
                })
                this.isloading = false
                this.search_model = false
            })
        },
        search: function (e) {
            if (!e.target.value) return
            this.isloading = true
            e.target.blur()
            searchValue = {
                number: new RegExp(e.target.value, 'ig')
            }
            getBundles(0, searchValue).then((resource) => {
                this.isloading = false
                this.search_model = true
                this.count = resource.total
                e.target.value = ''
                this.$emit('top')
                this.$emit('search', {
                    resource,
                    page: 0,
                    store: false,
                })
            })
        }
    }
})

Vue.component('poster-component', {
    template: `<div class="viewer-container" @click="close">
                    <div class="viewer-closeBtn">
                        <img src="./assets/images/close.svg">
                    </div>
                    <div class="loader"></div>
                    <div class="viewer">
                        <img :src="cover" />
                    </div>
               </div>`,
    props: ['cover'],
    methods: {
        close: function () {
            this.$emit('close')
        }
    }
})
Vue.component('mosaic', {
    template: `<canvas ref="canvas" class="canvas" :class="{show: !loading}"></canvas>`,
    props: ['source'],
    data: function () {
        return {
            img: new Image(),
            loading: true
        }
    },
    mounted: function() {
        this.drawImage()
    },
    methods: {
        drawImage: function () {
            var img = this.img
            var self = this
            var canvas = this.$refs.canvas
            var ctx = canvas.getContext('2d')
            var imageData, data, hColor, wColor;
            img.onload = function () {
                var width = img.width
                var height = img.height
                self.$refs.canvas.setAttribute('width', width)
                self.$refs.canvas.setAttribute('height', height)
                ctx.drawImage(img, 0, 0)
                imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                data = imageData.data
                for (h = 0; h < height; h++) {
                    var gap = h * width * 4
                    if (h % 5 === 0) {
                        hColor = {
                            r: data[gap],
                            g: data[gap + 1],
                            b: data[gap + 2]
                        }
                    } else {
                        data[gap] = hColor.r
                        data[gap + 1] = hColor.g
                        data[gap + 2] = hColor.b
                    }
                    wColor = hColor
                    for (w = 1; w < width; w++) {
                        var gap2 = gap + w * 4
                        if (w % 3 === 0) {
                            wColor = {
                                r: data[gap2],
                                g: data[gap2 + 1],
                                b: data[gap2 + 2]
                            }
                        } else {
                            data[gap2] = wColor.r
                            data[gap2 + 1] = wColor.g
                            data[gap2 + 2] = wColor.b
                        }
                    }
                }
                ctx.putImageData(imageData, 0, 0);
                self.loading = false
            }
            img.src = this.source
        }
    }
})
Vue.component('list-component', {
    template: `<div class="main-content" ref="mainContent" :class="{'force-top': top}">
                   <!-- <div style="height:36px;"></div>-->
                   <div id="scroller">
                    <ul>
                        <li class="itemlist" v-for="item in items" :key="item.number">
                            <div class="top-ctn">
                                <div class="left">
                                    <mosaic :source="item.pic" @click="openViewer(item.pic)"></mosaic>
                                    <!--<img :src="item.pic"  @click="openViewer(item.pic)"/>-->
                                </div>
                                <div class="right">
                                   <div class="info" v-html="item.info"> </div>
                                   <div class="mags">
                                        <p>点击拷贝</p>
                                        <div class="tags">
                                            <a class="tag" href="javascript:void(0)" v-for="magnet in item.magnet" @click="copyText(magnet.href)" :title="magnet.name">
                                                {{magnet.size}}
                                            </a>
                                        </div>
                                   </div>
                                   <!--<button class="btn btn-danger delete" @click="reportByNumber(item.number)">{{item.pic ? '报错': '删除'}}</button>-->
                                </div>
                            </div>
                            <!--<div class="bottom-ctn">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                        <th scope="col">First</th>
                                        <th scope="col">Last</th>
                                        <th scope="col"> </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <template v-for="magnet in item.magnet">
                                        <tr>
                                            <td class="hidden">{{magnet.name}}</td>
                                            <td class="hidden">{{magnet.size}}</td>
                                            <td><button class="btn btn-success" @click="copyText(magnet.href)">复制</button></td>
                                        </tr>
                                        </template>
                                    </tbody>
                                </table>
                            </div>-->
                        </li>
                    </ul>
                    </div>
                   <!-- <div style="height:40px;"></div> -->
                    <div class="tiptext" v-if="isCopied">{{tips}}</div>
                </div>`,
    props: ['docs', 'top'],
    data: function () {
        return {
            sid: null,
            propschanged: false,
            iscroll: null,
            isCopied: false,
            tips: ''
        }
    },
    watch: {
        docs: function () {
            this.propschanged = true
        }
    },
    computed: {
        items: function () {
            return this.docs
        }
    },
    methods: {
        copyText: function (text) {
            this.tips = "链接已拷贝"
            clearTimeout(this.sid)
            clipboard.writeText(unescape(text))
            this.isCopied = true
            this.sid = setTimeout(() => {
                this.isCopied = false
            }, 900)
        },
        openViewer: function (url) {
            //960x544
            if (url.indexOf()) {
                this.$emit('openViewer', url.replace('307x224', '960x544'))
            } else {
                this.$emit('openViewer', url.replace('.jpg', '_b.jpg').replace('thumb', 'cover'))
            }

        },
        deleteByNumber: function (number) {
            this.tips = "已通知管理员"
            clearTimeout(this.sid)
            this.isCopied = true
            Store.findOneAndRemove({ number }, (err) => {
                if (!err) {
                    this.sid = setTimeout(() => {
                        this.isCopied = false
                    }, 800)
                } else {
                    console.log(err)
                }
            })
        },
        reportByNumber: function (number) {
            this.tips = "已通知管理员"
            clearTimeout(this.sid)
            this.isCopied = true
            Store.findOneAndUpdate({ number }, { $set: { fake: true } }, (err) => {
                if (!err) {
                    this.sid = setTimeout(() => {
                        this.isCopied = false
                    }, 800)
                } else {
                    console.log(err)
                }
            })
        }
    },

    updated: function (...args) {
        if (!this.propschanged) return
        this.propschanged = false // result in an update
        this.$refs.mainContent.scrollTop = 0
        // this.iscroll.refresh()
        // this.iscroll.scrollTo(0, 0)
    }
})

Vue.component('footer-component', {
    template: `<footer>
                    <button id="prev" class="btn btn-primary btn-sm" style="left:20px;" @click="getPrevPageContent" v-if="prevShow">上一頁</button>
                    <button id="next" class="btn btn-primary btn-sm" style="right:20px;" @click="getNextPageContent" v-if="nextShow">下一頁</button>
                    <input id="page" type="text" v-model="value" @keyup.enter="getGivenPageContent"> /
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
        modify: function (resource, page, store) {
            this.$emit('modify', { resource, page, store })
        },
        getPrevPageContent: function () {
            const query = searchValue || ''
            this.isloading = true
            getBundles((this.currentpage - 1) * limits, query).then(resource => {
                this.isloading = false
                this.modify(resource, this.currentpage - 1, !query)
            })
        },
        getNextPageContent: function () {
            const query = searchValue || ''
            this.isloading = true
            getBundles(this.value * limits, query).then(resource => {
                this.isloading = false
                this.modify(resource, this.value, !query)
            })
        },
        getGivenPageContent: function (e) {
            const query = searchValue || ''
            const value = Number(e.target.value)
            e.target.blur()
            if (isNaN(value) || value > this.totals || !value || value === this.value) return
            this.isloading = true
            getBundles((value - 1) * limits, query).then(resource => {
                this.isloading = false
                this.modify(resource, value - 1, !query)
            })

        }
    }
})
Vue.component('store-component', {
    template: `<div class="store">
                 <loading-component :tiptext="tiptext" v-if="loaderShow"></loading-component>
                 <header-component v-on:back="updateWithTop" v-on:top="top=true" v-on:search="update" :show="!loaderShow"></header-component>
                 <list-component v-on:openViewer="open" :docs="resource.docs" :top="top"></list-component>
                 <poster-component v-if="showViewer" v-on:close="showViewer=false" :cover="cover"></poster-component>
                 <footer-component v-on:modify="update" :currentpage="currentPage" :top="top" :totals="totalpages"></footer-component>
               </div>`,
    data: function () {
        return {
            loaderShow: true,
            top: false,
            showViewer: false,
            cover: "",
            currentPage: !!localStorage.getItem("currentPage") ? Number(localStorage.getItem("currentPage")) : 0,
            resource: {},
            tiptext: '正在连接服务器...',
        }
    },
    beforeMount: function () {
        connectMongo(() => {
            this.tiptext = "正在加载资源..."
        })
        getBundles(this.currentPage * limits).then(resource => {
            console.log('fetched')
            // this.docs = resource.docs
            this.resource = Object.assign({}, this.resource, resource)
            mainWindow.hide()
            setTimeout(() => {
                this.loaderShow = false
                mainWindow.setMinimumSize(600, 700)
                mainWindow.setSize(600, 700)
                mainWindow.setResizable(true)
                mainWindow.center()
                // mainWindow.setOpacity(1)
                setTimeout(mainWindow.show, 10)
                // mainWindow.show()
            }, 500)
        })
    },

    computed: {
        totalpages: function () {
            return Math.ceil(this.resource.total / limits)
        }
    },
    methods: {
        open: function (data) {
            this.cover = data
            this.showViewer = true
        },
        update: function (data) {
            this.resource = Object.assign({}, this.resource, data.resource)
            this.currentPage = data.page
            !!data.store && localStorage.setItem('currentPage', this.currentPage)
        },
        updateWithTop: function (data) {
            this.update(data)
            this.top = false
        }
    }
})

