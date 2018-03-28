const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const mySchema = new mongoose.Schema({
    number:  String,
    pic: String,
    info: String,
    magnet: Array,
    fake: Boolean,
    needDelete: Boolean,
    insertDate: {type:Number, index: true}
})
mySchema.plugin(mongoosePaginate)
const Store = module.exports = mongoose.model('Store', mySchema)