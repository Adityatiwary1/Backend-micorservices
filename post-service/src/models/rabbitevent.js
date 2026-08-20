const mongoose=require('mongoose');
const outboxSchema = new mongoose.Schema(
    {
        eventType: {
            type: String,
            required: true,
            
        },

        payload: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },

        status: {
            type: String,
            enum: ['pending','published'],
            default: 'pending',
            index: true
        },

        attempts: {
            type: Number,
            default: 0
        },

        lastError: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);
const outbox= mongoose.model('outboxevent',outboxSchema);
module.exports=outbox;
