import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import {
  UserChatSession,
  UserChatMessage,
  MultiStepInstruction,
  LearnedFactUserInquiry,
  LearnedFactSelfLearning,
  DatabaseOverview,
  ExternalTrafficRecord,
} from './types.js';

interface FirebaseConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
  oAuthClientId?: string;
}

class FirebaseService {
  private app: FirebaseApp | null = null;
  private db: Firestore | null = null;
  public isConnected = false;
  public config: FirebaseConfig | null = null;

  constructor() {
    this.initFirebase();
  }

  private initFirebase() {
    try {
      let configData: FirebaseConfig | null = null;
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');

      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, 'utf8');
        configData = JSON.parse(raw);
      }

      if (!configData || !configData.projectId) {
        console.warn('[FirebaseService] firebase-applet-config.json not found or missing projectId.');
        return;
      }

      this.config = configData;

      if (!getApps().length) {
        this.app = initializeApp({
          apiKey: configData.apiKey,
          authDomain: configData.authDomain,
          projectId: configData.projectId,
          storageBucket: configData.storageBucket,
          messagingSenderId: configData.messagingSenderId,
          appId: configData.appId,
        });
      } else {
        this.app = getApp();
      }

      // Initialize Firestore with custom databaseId if configured
      const dbId = configData.firestoreDatabaseId || '(default)';
      try {
        this.db = getFirestore(this.app, dbId);
      } catch {
        this.db = getFirestore(this.app);
      }

      this.isConnected = true;
      console.log(`[FirebaseService] Firestore successfully connected (Project: ${configData.projectId}, DB: ${dbId})`);
    } catch (err) {
      console.warn('[FirebaseService] Failed to initialize Firebase Firestore:', err);
      this.isConnected = false;
    }
  }

  // --- USER CHAT SESSIONS ---
  public async saveChatSession(session: UserChatSession): Promise<void> {
    if (!this.db || !this.isConnected) return;
    try {
      const chatRef = doc(this.db, 'users', session.userId, 'chats', session.id);
      await setDoc(chatRef, session, { merge: true });
    } catch (err) {
      console.warn(`[Firebase] Error saving chat session ${session.id}:`, err);
    }
  }

  public async getChatSessions(userId: string): Promise<UserChatSession[]> {
    if (!this.db || !this.isConnected) return [];
    try {
      const chatsRef = collection(this.db, 'users', userId, 'chats');
      const snap = await getDocs(chatsRef);
      const list: UserChatSession[] = [];
      snap.forEach((d) => list.push(d.data() as UserChatSession));
      return list.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (err) {
      console.warn(`[Firebase] Error getting chat sessions for user ${userId}:`, err);
      return [];
    }
  }

  public async getChatSession(userId: string, chatId: string): Promise<UserChatSession | null> {
    if (!this.db || !this.isConnected) return null;
    try {
      const chatRef = doc(this.db, 'users', userId, 'chats', chatId);
      const snap = await getDoc(chatRef);
      if (snap.exists()) {
        return snap.data() as UserChatSession;
      }
      return null;
    } catch (err) {
      console.warn(`[Firebase] Error getting chat ${chatId}:`, err);
      return null;
    }
  }

  public async deleteChatSession(userId: string, chatId: string): Promise<void> {
    if (!this.db || !this.isConnected) return;
    try {
      const chatRef = doc(this.db, 'users', userId, 'chats', chatId);
      await deleteDoc(chatRef);
    } catch (err) {
      console.warn(`[Firebase] Error deleting chat ${chatId}:`, err);
    }
  }

  // --- CHAT MESSAGES ---
  public async saveChatMessage(msg: UserChatMessage): Promise<void> {
    if (!this.db || !this.isConnected) return;
    try {
      const msgRef = doc(this.db, 'users', msg.userId, 'chats', msg.chatId, 'messages', msg.id);
      await setDoc(msgRef, msg, { merge: true });
    } catch (err) {
      console.warn(`[Firebase] Error saving message ${msg.id}:`, err);
    }
  }

  public async getChatMessages(userId: string, chatId: string): Promise<UserChatMessage[]> {
    if (!this.db || !this.isConnected) return [];
    try {
      const msgsRef = collection(this.db, 'users', userId, 'chats', chatId, 'messages');
      const snap = await getDocs(msgsRef);
      const list: UserChatMessage[] = [];
      snap.forEach((d) => list.push(d.data() as UserChatMessage));
      return list.sort((a, b) => a.timestamp - b.timestamp);
    } catch (err) {
      console.warn(`[Firebase] Error getting messages for ${chatId}:`, err);
      return [];
    }
  }

  // --- MULTI-STEP INSTRUCTIONS ---
  public async saveInstruction(instruction: MultiStepInstruction): Promise<void> {
    if (!this.db || !this.isConnected) return;
    try {
      const instRef = doc(this.db, 'users', instruction.userId, 'instructions', instruction.id);
      await setDoc(instRef, instruction, { merge: true });
    } catch (err) {
      console.warn(`[Firebase] Error saving instruction ${instruction.id}:`, err);
    }
  }

  public async getInstructions(userId: string): Promise<MultiStepInstruction[]> {
    if (!this.db || !this.isConnected) return [];
    try {
      const instsRef = collection(this.db, 'users', userId, 'instructions');
      const snap = await getDocs(instsRef);
      const list: MultiStepInstruction[] = [];
      snap.forEach((d) => list.push(d.data() as MultiStepInstruction));
      return list.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (err) {
      console.warn(`[Firebase] Error getting instructions for user ${userId}:`, err);
      return [];
    }
  }

  public async getActiveInstruction(userId: string, chatId: string): Promise<MultiStepInstruction | null> {
    if (!this.db || !this.isConnected) return null;
    try {
      const instsRef = collection(this.db, 'users', userId, 'instructions');
      const q = query(instsRef, where('chatId', '==', chatId), where('status', '==', 'active'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as MultiStepInstruction;
      }
      return null;
    } catch (err) {
      console.warn(`[Firebase] Error getting active instruction for ${chatId}:`, err);
      return null;
    }
  }

  // --- DATABASE 2: LEARNED FACTS FROM USER INQUIRIES ---
  public async saveLearnedFactUserInquiry(fact: LearnedFactUserInquiry): Promise<void> {
    if (!this.db || !this.isConnected) return;
    try {
      const factRef = doc(this.db, 'learned_facts_user_inquiries', fact.id);
      await setDoc(factRef, fact, { merge: true });
    } catch (err) {
      console.warn(`[Firebase] Error saving user inquiry fact ${fact.id}:`, err);
    }
  }

  public async getLearnedFactsUserInquiries(maxCount = 50): Promise<LearnedFactUserInquiry[]> {
    if (!this.db || !this.isConnected) return [];
    try {
      const factsRef = collection(this.db, 'learned_facts_user_inquiries');
      const snap = await getDocs(factsRef);
      const list: LearnedFactUserInquiry[] = [];
      snap.forEach((d) => list.push(d.data() as LearnedFactUserInquiry));
      return list.sort((a, b) => b.timestamp - a.timestamp).slice(0, maxCount);
    } catch (err) {
      console.warn(`[Firebase] Error getting user inquiry facts:`, err);
      return [];
    }
  }

  // --- DATABASE 3: LEARNED FACTS FROM AUTONOMOUS SELF-LEARNING ---
  public async saveLearnedFactSelfLearning(fact: LearnedFactSelfLearning): Promise<void> {
    if (!this.db || !this.isConnected) return;
    try {
      const factRef = doc(this.db, 'learned_facts_self_learning', fact.id);
      await setDoc(factRef, fact, { merge: true });
    } catch (err) {
      console.warn(`[Firebase] Error saving self-learning fact ${fact.id}:`, err);
    }
  }

  public async getLearnedFactsSelfLearning(maxCount = 50): Promise<LearnedFactSelfLearning[]> {
    if (!this.db || !this.isConnected) return [];
    try {
      const factsRef = collection(this.db, 'learned_facts_self_learning');
      const snap = await getDocs(factsRef);
      const list: LearnedFactSelfLearning[] = [];
      snap.forEach((d) => list.push(d.data() as LearnedFactSelfLearning));
      return list.sort((a, b) => b.timestamp - a.timestamp).slice(0, maxCount);
    } catch (err) {
      console.warn(`[Firebase] Error getting self-learning facts:`, err);
      return [];
    }
  }

  // --- DATABASE 4: EXTERNAL & REMOTE WEBSITE TRAFFIC ---
  public async saveExternalTrafficRecord(record: ExternalTrafficRecord): Promise<void> {
    if (!this.db || !this.isConnected) return;
    try {
      const docRef = doc(this.db, 'external_traffic', record.id);
      await setDoc(docRef, record, { merge: true });
    } catch (err) {
      console.warn(`[Firebase] Error saving external traffic record ${record.id}:`, err);
    }
  }

  public async getExternalTrafficRecords(maxCount = 100): Promise<ExternalTrafficRecord[]> {
    if (!this.db || !this.isConnected) return [];
    try {
      const colRef = collection(this.db, 'external_traffic');
      const snap = await getDocs(colRef);
      const list: ExternalTrafficRecord[] = [];
      snap.forEach((d) => list.push(d.data() as ExternalTrafficRecord));
      return list.sort((a, b) => b.timestamp - a.timestamp).slice(0, maxCount);
    } catch (err) {
      console.warn(`[Firebase] Error getting external traffic records:`, err);
      return [];
    }
  }
}

export const firebaseService = new FirebaseService();
