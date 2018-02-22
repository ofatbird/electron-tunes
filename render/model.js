const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const mySchema = new mongoose.Schema({
    number: {
        type: String,
        index: true
    },
    pic: String,
    info: String,
    magnet: String,
    insertDate: Number
})
mySchema.plugin(mongoosePaginate)
const Store = module.exports = mongoose.model('Store', mySchema)