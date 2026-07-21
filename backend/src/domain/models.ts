// ─── Domain Models ─────────────────────────────────────────────────────────────
// Real domain models with behavior, not just anemic data structures.

export class Profile {
  constructor(
    public uid: string,
    public displayName: string,
    public email: string,
    public role: 'HOST' | 'SEEKER' | 'FLEX',
    public status: 'email_unverified' | 'active' | 'inactive' | 'paused' | 'warning' | 'suspended' | 'under_appeal' | 'reinstated' | 'banned',
    public twoFactorEnabled: boolean = false,
    public metadata: Record<string, any> = {}
  ) {}

  isActive(): boolean {
    return this.status === 'active' || this.status === 'reinstated' || this.status === 'warning'
  }

  isBanned(): boolean {
    return this.status === 'banned'
  }

  suspend(reason: string): void {
    if (this.isBanned()) throw new Error('Cannot suspend a banned profile')
    this.status = 'suspended'
    this.metadata.suspensionReason = reason
    this.metadata.suspensionDate = new Date().toISOString()
  }

  activate(): void {
    if (this.isBanned()) throw new Error('Cannot activate a banned profile')
    this.status = 'active'
    delete this.metadata.suspensionReason
    delete this.metadata.suspensionDate
  }

  ban(): void {
    this.status = 'banned'
  }

  toJSON() {
    return {
      uid: this.uid,
      displayName: this.displayName,
      email: this.email,
      role: this.role,
      status: this.status,
      twoFactorEnabled: this.twoFactorEnabled,
      ...this.metadata
    }
  }

  static fromFirestore(id: string, data: any): Profile {
    const { displayName, email, role, status, twoFactorEnabled, ...metadata } = data
    return new Profile(id, displayName, email, role, status, twoFactorEnabled, metadata)
  }
}

export class Listing {
  constructor(
    public id: string,
    public hostId: string,
    public zone: string,
    public status: 'active' | 'paused' | 'filled',
    public metadata: Record<string, any> = {}
  ) {}

  pause(): void {
    this.status = 'paused'
  }

  activate(): void {
    this.status = 'active'
  }

  markFilled(): void {
    this.status = 'filled'
  }

  toJSON() {
    return {
      id: this.id,
      hostId: this.hostId,
      zone: this.zone,
      status: this.status,
      ...this.metadata
    }
  }

  static fromFirestore(id: string, data: any): Listing {
    const { hostId, zone, status, ...metadata } = data
    return new Listing(id, hostId, zone, status, metadata)
  }
}

export class Match {
  constructor(
    public id: string,
    public userA: string,
    public userB: string,
    public participants: [string, string],
    public status: 'pending' | 'matched' | 'archived',
    public createdAt: Date,
    public chatUnlocked: boolean = true
  ) {}

  static create(userA: string, userB: string): Match {
    const sorted = [userA, userB].sort() as [string, string]
    const id = `${sorted[0]}_${sorted[1]}`
    return new Match(id, sorted[0], sorted[1], sorted, 'matched', new Date(), true)
  }

  isParticipant(uid: string): boolean {
    return this.participants.includes(uid)
  }

  chatId(): string {
    return this.id
  }

  archive(): void {
    this.status = 'archived'
    this.chatUnlocked = false
  }

  toJSON() {
    return {
      userA: this.userA,
      userB: this.userB,
      participants: this.participants,
      status: this.status,
      createdAt: this.createdAt,
      chatUnlocked: this.chatUnlocked
    }
  }

  static fromFirestore(id: string, data: any): Match {
    return new Match(
      id,
      data.userA,
      data.userB,
      data.participants,
      data.status,
      data.createdAt?.toDate?.() || new Date(data.createdAt),
      data.chatUnlocked
    )
  }
}

export class Chat {
  constructor(
    public id: string,
    public participants: string[],
    public status: 'matched' | 'archived',
    public updatedAt: Date,
    public lastMessage: string = '',
    public unreadBy: string[] = []
  ) {}

  static create(matchId: string, participants: string[]): Chat {
    return new Chat(matchId, participants, 'matched', new Date())
  }

  isParticipant(uid: string): boolean {
    return this.participants.includes(uid)
  }

  updateLastMessage(text: string, senderUid: string): void {
    this.lastMessage = text
    this.updatedAt = new Date()
    this.unreadBy = this.participants.filter(p => p !== senderUid)
  }

  markReadBy(uid: string): void {
    this.unreadBy = this.unreadBy.filter(p => p !== uid)
  }

  archive(): void {
    this.status = 'archived'
  }

  toJSON() {
    return {
      participants: this.participants,
      status: this.status,
      updatedAt: this.updatedAt,
      lastMessage: this.lastMessage,
      unreadBy: this.unreadBy
    }
  }

  static fromFirestore(id: string, data: any): Chat {
    return new Chat(
      id,
      data.participants,
      data.status,
      data.updatedAt?.toDate?.() || new Date(data.updatedAt),
      data.lastMessage,
      data.unreadBy || []
    )
  }
}

export class Message {
  constructor(
    public id: string,
    public matchId: string,
    public senderUid: string,
    public text: string,
    public createdAt: Date,
    public read: boolean = false
  ) {}

  static create(matchId: string, senderUid: string, text: string): Message {
    // Note: ID usually generated by repository via auto-id
    return new Message('', matchId, senderUid, text, new Date(), false)
  }

  markRead(): void {
    this.read = true
  }

  toJSON() {
    return {
      matchId: this.matchId,
      senderUid: this.senderUid,
      text: this.text,
      createdAt: this.createdAt,
      read: this.read
    }
  }

  static fromFirestore(id: string, data: any): Message {
    return new Message(
      id,
      data.matchId,
      data.senderUid,
      data.text,
      data.createdAt?.toDate?.() || new Date(data.createdAt),
      data.read
    )
  }
}

export class Report {
  constructor(
    public id: string,
    public reportedBy: string,
    public reportedUserId: string,
    public reason: string,
    public status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed',
    public createdAt: Date,
    public metadata: Record<string, any> = {}
  ) {}

  static create(reportedBy: string, reportedUserId: string, reason: string): Report {
    return new Report('', reportedBy, reportedUserId, reason, 'pending', new Date())
  }

  resolve(newStatus: 'action_taken' | 'dismissed'): void {
    if (this.status !== 'pending' && this.status !== 'reviewed') {
      throw new Error('Report is already resolved')
    }
    this.status = newStatus
  }

  toJSON() {
    return {
      reportedBy: this.reportedBy,
      reportedUserId: this.reportedUserId,
      reason: this.reason,
      status: this.status,
      createdAt: this.createdAt,
      ...this.metadata
    }
  }

  static fromFirestore(id: string, data: any): Report {
    const { reportedBy, reportedUserId, reason, status, createdAt, ...metadata } = data
    return new Report(
      id,
      reportedBy,
      reportedUserId,
      reason,
      status,
      createdAt?.toDate?.() || new Date(createdAt),
      metadata
    )
  }
}

export class Notification {
  constructor(
    public id: string,
    public userId: string,
    public type: string,
    public title: string,
    public message: string,
    public isRead: boolean,
    public createdAt: Date,
    public metadata: Record<string, any> = {}
  ) {}

  static create(userId: string, type: string, title: string, message: string, metadata: Record<string, any> = {}): Notification {
    return new Notification('', userId, type, title, message, false, new Date(), metadata)
  }

  markRead(): void {
    this.isRead = true
  }

  toJSON() {
    return {
      userId: this.userId,
      type: this.type,
      title: this.title,
      message: this.message,
      isRead: this.isRead,
      createdAt: this.createdAt,
      metadata: this.metadata
    }
  }

  static fromFirestore(id: string, data: any): Notification {
    return new Notification(
      id,
      data.userId,
      data.type,
      data.title,
      data.message,
      data.isRead,
      data.createdAt?.toDate?.() || new Date(data.createdAt),
      data.metadata || {}
    )
  }
}
