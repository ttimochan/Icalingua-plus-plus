<template>
    <a @click="$emit('click')" @click.right="$emit('contextmenu', $event)">
        <div class="root" :class="{ selected }">
            <div class="entry">
                <div class="left">
                    <el-badge value="@" :type="room.at === 'all' ? 'warning' : undefined" :hidden="!room.at">
                        <div class="avatar-container">
                            <el-avatar size="large" :src="roomAvatar" />
                            <el-avatar
                                class="sub-avatar"
                                :size="20"
                                :src="roomSubAvatar"
                                v-if="room.users.length > 2 && room.lastMessage && room.lastMessage.userId"
                            />
                        </div>
                        <el-badge
                            class="avatar-only-unread"
                            :value="room.unreadCount"
                            :type="room.priority < priority ? 'info' : undefined"
                            v-show="room.unreadCount > 0"
                        />
                    </el-badge>
                </div>
                <div class="right">
                    <div class="flex l1" :class="{ withoutdesc: !desc }">
                        <div class="name" :title="roomName">
                            {{ roomName }}
                        </div>
                        <div class="icon" v-show="room.priority < priority">
                            <i class="el-icon-close-notification"></i>
                        </div>
                        <div class="icon" v-show="room.index === 1">
                            <i class="el-icon-arrow-up"></i>
                        </div>
                        <div class="timestamp">
                            {{ timestamp }}
                        </div>
                    </div>
                    <div class="flex">
                        <div class="desc" :title="desc">
                            {{ desc }}
                        </div>
                        <div v-show="room.unreadCount !== 0">
                            <el-badge :value="room.unreadCount" :type="room.priority < priority ? 'info' : undefined" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </a>
</template>

<script>
import getAvatarUrl from '../../utils/getAvatarUrl'
import removeGroupNameEmotes from '../../utils/removeGroupNameEmotes'
import { spacingNotification } from '../../utils/panguSpacing'

export default {
    name: 'RoomEntry',
    props: {
        room: Object,
        selected: Boolean,
        priority: Number,
        removeEmotes: Boolean,
        usePanguJs: Boolean,
    },
    computed: {
        desc() {
            let d = ''
            if (this.room.roomId < 0 && this.room.lastMessage.username) {
                d += this.room.lastMessage.username + ': '
            }
            const content = this.room.lastMessage.content
            d += this.usePanguJs ? spacingNotification(content) : content
            return d
        },
        timestamp() {
            const now = new Date()
            const time = new Date(this.room.utime)
            if (now.getFullYear() === time.getFullYear() && now.getMonth() === time.getMonth())
                if (now.getDate() === time.getDate()) return this.room.lastMessage.timestamp
                else if (now.getDate() - time.getDate() === 1) return '昨天'
            if (now.getFullYear() !== time.getFullYear())
                return (time.getFullYear() % 100) + '-' + (time.getMonth() + 1) + '-' + time.getDate()
            return time.getMonth() + 1 + '-' + time.getDate()
        },
        roomAvatar() {
            return getAvatarUrl(this.room.roomId)
        },
        roomSubAvatar() {
            return getAvatarUrl(this.room.lastMessage.userId)
        },
        roomName() {
            return this.removeEmotes ? removeGroupNameEmotes(this.room.roomName) : this.room.roomName
        },
    },
}
</script>

<style scoped>
.root {
    padding: 0 15px;
    transition: background-color 0.3s;
    cursor: default;
    container-type: inline-size;
}

.root:not(.selected):hover {
    background-color: var(--panel-item-bg-hover);
}

div.entry {
    padding: 10px 0;
    height: 50px;
    display: flex;
    align-items: center;
    border-bottom: var(--chat-border-style);
}

.left {
    width: max-content;
    float: left;
    padding-top: 5px;
}

.right {
    margin-left: 15px;
    width: 100%;
}

.rooms-panel.avatar-only .right {
    display: none;
}

a {
    text-decoration: none;
}

.desc {
    color: var(--panel-color-desc);
    font-size: 12px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    width: 0;
    flex: 1;
}

.icon {
    color: var(--panel-color-icon);
    font-size: 11px;
    margin-left: 2px;
}

.name {
    font-weight: bold;
    color: var(--panel-color-name);
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    width: 0;
    flex: 1;
    font-size: 16px;
}

.timestamp {
    margin-left: 5px;
    color: var(--panel-color-timestamp);
    font-size: 11px;
    white-space: nowrap;
}

.withoutdesc {
    margin-top: 10px;
    margin-bottom: 10px;
}

.flex {
    display: flex;
    height: 18px;
    justify-content: flex-end;
}

.l1 {
    height: 25px;
}

.selected {
    background-color: var(--panel-item-bg);
}

.el-badge {
    margin-top: -2px;
    margin-left: 2px;
}

::v-deep .el-badge * {
    font-family: msyh;
}

@container (max-width: 130px) {
    .name,
    .desc {
        display: none;
    }
}

.avatar-only-unread {
    display: none;
}
.avatar-only .avatar-only-unread {
    display: block;
    position: absolute;
    top: 30px;
    left: 24px;
}

.avatar-container {
    position: relative;
}

.sub-avatar {
    position: absolute;
    bottom: -2px;
    right: -2px;
}

@container (max-width: 80px) {
    .sub-avatar {
        display: none;
    }
}
</style>
