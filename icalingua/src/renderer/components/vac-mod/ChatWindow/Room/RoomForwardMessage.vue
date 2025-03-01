<template>
    <transition name="vac-slide-up">
        <div v-if="showForwardPanel" class="vac-forward-container">
            <div class="vac-forward-box">
                <el-button
                    type="primary"
                    @click="stopForward(true, false)"
                    :disabled="msgsToForward.length === 0"
                    icon="el-icon-share"
                    >逐条转发</el-button
                >
                <el-button
                    type="primary"
                    @click="stopForward(true)"
                    :disabled="msgsToForward.length === 0"
                    icon="el-icon-share"
                    >合并转发</el-button
                >
                <el-button
                    type="primary"
                    @click="recallMsgs"
                    :disabled="msgsToForward.length === 0"
                    icon="el-icon-delete"
                    >批量撤回</el-button
                >
            </div>

            <div class="vac-icon-forward">
                <div class="vac-svg-button" @click="stopForward(false)">
                    <slot name="forward-close-icon">
                        <svg-icon name="close-outline" />
                    </slot>
                </div>
            </div>
            <div class="vac-selected-counter" v-if="showForwardPanel">已选 {{ msgsToForward.length }} 条消息</div>
        </div>
    </transition>
</template>

<script>
import SvgIcon from '../../components/SvgIcon'
import ipc from '../../../../utils/ipc'
export default {
    name: 'RoomForwardMessage',
    components: {
        SvgIcon,
    },

    props: {
        messages: { type: Array, required: true },
        msgsToForward: { type: Array, required: true },
        showForwardPanel: { type: Boolean, required: true },
        account: { type: Number, required: true },
        username: { type: String, required: true },
        roomId: { type: [String, Number], required: true },
    },
    methods: {
        stopForward(isCreate, multi = true) {
            if (isCreate) this.$emit('choose-forward-target', multi)
            else this.$emit('close-forward-panel')
        },
        recallMsgs() {
            this.msgsToForward.forEach((msg, index) => {
                const waitTime = Math.floor(index / 5) * 1000
                setTimeout(() => {
                    ipc.deleteMessage(this.roomId, msg)
                }, index * 200 + waitTime)
            })
            this.stopForward(false)
        },
    },
}
</script>

<style lang="scss">
.vac-forward-container {
    position: relative;
    display: flex;
    padding: 10px 10px 0 10px;
    background: var(--chat-footer-bg-color);
    align-items: center;
    width: calc(100% - 20px);

    .vac-forward-box {
        width: 100%;
        overflow: hidden;
        background: var(--chat-footer-bg-color-forward);
        border-radius: 4px;
        padding: 8px 10px;
        display: flex;
    }

    .vac-forward-info {
        overflow: hidden;
    }

    .vac-forward-username {
        color: var(--chat-message-color-forward-username);
        font-size: 12px;
        line-height: 15px;
        margin-bottom: 2px;
    }

    .vac-forward-content {
        font-size: 12px;
        color: var(--chat-message-color-forward-content);
        white-space: pre-line;
    }

    .vac-icon-forward {
        margin-left: 10px;

        svg {
            height: 20px;
            width: 20px;
        }
    }

    .vac-image-forward {
        max-height: 100px;
        margin-right: 10px;
        border-radius: 4px;
    }
}

@media only screen and (max-width: 768px) {
    .vac-forward-container {
        padding: 5px 8px;
        width: calc(100% - 16px);
    }
}

.vac-selected-counter {
    position: absolute;
    align-items: center;
    bottom: 80px;
    right: 20px;
    padding: 8px;
    background: var(--chat-footer-bg-color);
    border-radius: 4px;
    display: flex;
    z-index: 10;
    pointer-events: none;
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.2);
}
</style>
