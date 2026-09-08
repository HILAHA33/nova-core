import { MultiStepInstruction } from './types.js';
import { firebaseService } from './firebaseService.js';

interface InstructionEvaluationResult {
  hasActiveInstruction: boolean;
  isNewInstruction: boolean;
  instruction: MultiStepInstruction | null;
  stepResponseText?: string;
  isCompleted: boolean;
  summary?: string;
}

export class InstructionEngine {
  private activeInstructionsMap: Map<string, MultiStepInstruction> = new Map();

  constructor() {
    // In-memory cache synced with Firebase
  }

  private getKey(userId: string, chatId: string): string {
    return `${userId}:::${chatId}`;
  }

  public async getActiveInstruction(userId: string, chatId: string): Promise<MultiStepInstruction | null> {
    const key = this.getKey(userId, chatId);
    if (this.activeInstructionsMap.has(key)) {
      const inst = this.activeInstructionsMap.get(key)!;
      if (inst.status === 'active') return inst;
    }

    // Query Firestore
    const fromDb = await firebaseService.getActiveInstruction(userId, chatId);
    if (fromDb && fromDb.status === 'active') {
      this.activeInstructionsMap.set(key, fromDb);
      return fromDb;
    }
    return null;
  }

  public async cancelInstruction(userId: string, chatId: string): Promise<boolean> {
    const inst = await this.getActiveInstruction(userId, chatId);
    if (inst) {
      inst.status = 'cancelled';
      inst.updatedAt = Date.now();
      const key = this.getKey(userId, chatId);
      this.activeInstructionsMap.delete(key);
      await firebaseService.saveInstruction(inst);
      return true;
    }
    return false;
  }

  public async processMessage(
    userId: string,
    chatId: string,
    messageContent: string
  ): Promise<InstructionEvaluationResult> {
    const key = this.getKey(userId, chatId);
    const existing = await this.getActiveInstruction(userId, chatId);

    // 1. If an active instruction is currently in progress for this chat:
    if (existing && existing.status === 'active') {
      return this.handleActiveStep(existing, messageContent);
    }

    // 2. Check if the current message initiates a new multi-step instruction:
    const newInstruction = this.detectNewInstruction(userId, chatId, messageContent);
    if (newInstruction) {
      this.activeInstructionsMap.set(key, newInstruction);
      await firebaseService.saveInstruction(newInstruction);

      const acknowledgment = this.generateInstructionAcknowledgment(newInstruction);
      return {
        hasActiveInstruction: true,
        isNewInstruction: true,
        instruction: newInstruction,
        stepResponseText: acknowledgment,
        isCompleted: false,
        summary: `Initialized multi-step goal: ${newInstruction.rawInstruction}`,
      };
    }

    return {
      hasActiveInstruction: false,
      isNewInstruction: false,
      instruction: null,
      isCompleted: false,
    };
  }

  private detectNewInstruction(userId: string, chatId: string, content: string): MultiStepInstruction | null {
    const text = content.toLowerCase();

    // Check for multi-turn calculation / instruction patterns
    // E.g. "multiply whatever number I tell you in the next 2 messages and than add all the numbers together in the 3rd message and tell me what it is"
    const hasNextMessages =
      text.includes('next 2 messages') ||
      text.includes('next 3 messages') ||
      text.includes('next two messages') ||
      text.includes('next three messages') ||
      text.includes('next message') ||
      text.includes('in the 3rd message') ||
      text.includes('in the third message') ||
      text.includes('3rd message');

    const hasMathOperations =
      (text.includes('multiply') || text.includes('times') || text.includes('product')) &&
      (text.includes('add') || text.includes('sum') || text.includes('total') || text.includes('plus'));

    const hasSequentialKeywords =
      text.includes('step 1') ||
      text.includes('next 2') ||
      text.includes('next 3') ||
      text.includes('for the next');

    if ((hasNextMessages && hasMathOperations) || (text.includes('multiply') && text.includes('3rd message')) || text.includes('multiply whatever number')) {
      // Math accumulator pattern (e.g. 2 multiplier steps + 1 final sum step = 3 total turns)
      let totalSteps = 3;
      if (text.includes('next 3 messages') || text.includes('4th message') || text.includes('fourth message')) {
        totalSteps = 4;
      }

      return {
        id: `inst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId,
        chatId,
        status: 'active',
        rawInstruction: content,
        instructionType: 'math_accumulator',
        totalRequiredSteps: totalSteps,
        currentStep: 0,
        capturedInputs: [],
        capturedNumbers: [],
        targetOperation: 'multiply_then_sum_all',
        stepHistory: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    // General multi-step accumulator
    if (hasNextMessages && (text.includes('add') || text.includes('sum') || text.includes('calculate') || text.includes('remember'))) {
      return {
        id: `inst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId,
        chatId,
        status: 'active',
        rawInstruction: content,
        instructionType: 'math_accumulator',
        totalRequiredSteps: 3,
        currentStep: 0,
        capturedInputs: [],
        capturedNumbers: [],
        targetOperation: 'sequential_accumulator',
        stepHistory: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    return null;
  }

  private async handleActiveStep(
    instruction: MultiStepInstruction,
    messageContent: string
  ): Promise<InstructionEvaluationResult> {
    const extractedNum = this.extractNumberFromText(messageContent);
    instruction.currentStep += 1;
    instruction.capturedInputs.push(messageContent);

    if (extractedNum !== null) {
      instruction.capturedNumbers.push(extractedNum);
    }

    instruction.updatedAt = Date.now();

    const isCompleted = instruction.currentStep >= instruction.totalRequiredSteps;
    let stepResponse = '';

    if (instruction.instructionType === 'math_accumulator') {
      if (!isCompleted) {
        // Intermediate step
        const stepNum = instruction.currentStep;
        const total = instruction.totalRequiredSteps;
        const numbersSoFar = instruction.capturedNumbers;

        stepResponse = `### Step ${stepNum} of ${total} Recorded\n\n` +
          `• Captured Value: **${extractedNum !== null ? extractedNum : messageContent}**\n` +
          `• Numbers Logged So Far: [${numbersSoFar.join(', ')}]\n` +
          (stepNum === 1
            ? `• Next Expected Step: Send message ${stepNum + 1} with the second number to multiply.`
            : `• Next Expected Step: Send message ${stepNum + 1} with the final number to add and complete the computation.`);

        instruction.stepHistory.push({
          step: stepNum,
          input: messageContent,
          extractedValues: { number: extractedNum },
          stepOutput: stepResponse,
          timestamp: Date.now(),
        });
      } else {
        // Final completion step! Execute the full mathematical logic
        instruction.status = 'completed';
        const nums = instruction.capturedNumbers;
        
        // Let's compute based on captured numbers
        // E.g. nums: [n1, n2, n3]
        const n1 = nums[0] !== undefined ? nums[0] : 0;
        const n2 = nums[1] !== undefined ? nums[1] : 0;
        const n3 = nums[2] !== undefined ? nums[2] : (extractedNum !== null ? extractedNum : 0);

        const product = n1 * n2;
        const sumOfAllInputs = nums.reduce((acc, curr) => acc + curr, 0);
        const productPlusN3 = product + n3;
        const totalGrandCombined = product + sumOfAllInputs;

        stepResponse = `### Multi-Step Instruction Execution Completed!\n\n` +
          `Here is the complete calculation based on the instructions you gave across the last ${instruction.totalRequiredSteps} messages:\n\n` +
          `### 1. Recorded Inputs Across Turns:\n` +
          `• Message 1 (Step 1): Number **${n1}**\n` +
          `• Message 2 (Step 2): Number **${n2}**\n` +
          `• Message 3 (Step 3): Number **${n3}**\n\n` +
          `### 2. Step-by-Step Mathematical Computation:\n` +
          `• Step 1 & 2 Multiplication: ${n1} × ${n2} = **${product}**\n` +
          `• Step 3 Addition (Product + 3rd message number): ${product} + ${n3} = **${productPlusN3}**\n` +
          `• Sum of all 3 raw input numbers: ${n1} + ${n2} + ${n3} = **${sumOfAllInputs}**\n` +
          `• Grand combined total (Product + all numbers): ${product} + ${n1} + ${n2} + ${n3} = **${totalGrandCombined}**\n\n` +
          `### Final Result:\n` +
          `The primary result of multiplying the first two numbers (${n1} × ${n2} = ${product}) and adding the third number (${n3}) is **${productPlusN3}** (or **${sumOfAllInputs}** for raw sum of all values).`;

        instruction.finalResult = `Product(${n1}×${n2}=${product}), SumOfAll(${sumOfAllInputs}), Product+N3(${productPlusN3})`;

        instruction.stepHistory.push({
          step: instruction.currentStep,
          input: messageContent,
          extractedValues: { number: extractedNum, finalResult: instruction.finalResult },
          stepOutput: stepResponse,
          timestamp: Date.now(),
        });
      }
    } else {
      // General multi-step
      if (isCompleted) {
        instruction.status = 'completed';
        stepResponse = `### Multi-Step Instruction Completed\n\nAll ${instruction.totalRequiredSteps} steps have been successfully executed and recorded in your chat memory history.`;
      } else {
        stepResponse = `### Step ${instruction.currentStep} of ${instruction.totalRequiredSteps} Logged\n\nRecorded: "${messageContent}". Ready for the next message.`;
      }
    }

    const key = this.getKey(instruction.userId, instruction.chatId);
    if (isCompleted) {
      this.activeInstructionsMap.delete(key);
    } else {
      this.activeInstructionsMap.set(key, instruction);
    }

    await firebaseService.saveInstruction(instruction);

    return {
      hasActiveInstruction: true,
      isNewInstruction: false,
      instruction,
      stepResponseText: stepResponse,
      isCompleted,
      summary: isCompleted
        ? `Completed multi-step goal for chat ${instruction.chatId}`
        : `Progressed to step ${instruction.currentStep}/${instruction.totalRequiredSteps}`,
    };
  }

  private generateInstructionAcknowledgment(instruction: MultiStepInstruction): string {
    return `### Multi-Step Instruction Activated!\n\n` +
      `I have registered your instruction in stateful memory:\n` +
      `> "${instruction.rawInstruction}"\n\n` +
      `### Execution Plan:\n` +
      `• Total Steps Tracked: **${instruction.totalRequiredSteps} consecutive messages**\n` +
      `• Step 1: Send me the first number in your next message.\n` +
      `• Step 2: Send me the second number to multiply with the first.\n` +
      `• Step 3: Send me the third number, and I will compute the final multiplied and summed total for you!\n\n` +
      `This state is saved in Firebase Firestore under your chat session. Please send your first number now!`;
  }

  private extractNumberFromText(text: string): number | null {
    if (!text) return null;
    const trimmed = text.trim();

    // Check direct numeric value (e.g. "4", "4.5", "-10")
    const directMatch = trimmed.match(/^-?\d+(\.\d+)?$/);
    if (directMatch) {
      return parseFloat(directMatch[0]);
    }

    // Check number inside a sentence (e.g. "The number is 5", "use 12", "my number is 25")
    const sentenceMatch = trimmed.match(/(-?\d+(\.\d+)?)/);
    if (sentenceMatch) {
      return parseFloat(sentenceMatch[1]);
    }

    // Word to number mapping for common written numbers
    const words: Record<string, number> = {
      zero: 0,
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
      eleven: 11,
      twelve: 12,
      thirteen: 13,
      fourteen: 14,
      fifteen: 15,
      sixteen: 16,
      seventeen: 17,
      eighteen: 18,
      nineteen: 19,
      twenty: 20,
      thirty: 30,
      forty: 40,
      fifty: 50,
      sixty: 60,
      seventy: 70,
      eighty: 80,
      ninety: 90,
      hundred: 100,
    };

    const lower = text.toLowerCase();
    for (const [w, n] of Object.entries(words)) {
      const regex = new RegExp(`\\b${w}\\b`, 'i');
      if (regex.test(lower)) {
        return n;
      }
    }

    return null;
  }
}

export const instructionEngine = new InstructionEngine();
