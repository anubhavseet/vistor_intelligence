const mongoose = require('mongoose');

async function test() {
    await mongoose.connect('mongodb://127.0.0.1:27017/visitor-intelligence');
    const subs = await mongoose.connection.useDb('visitor-intelligence').collection('subscriptions').find({}).sort({ createdAt: -1 }).limit(3).toArray();
    console.log(JSON.stringify(subs, null, 2));
    process.exit(0);
}
test();
