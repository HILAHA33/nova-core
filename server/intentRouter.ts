export interface IntentAnalysis {
  intent: string;
  detectedEntities: string[];
  complexityScore: number;
  sentiment: 'positive' | 'neutral' | 'inquisitive' | 'critical';
  taskType: 'coding' | 'system_design' | 'explanation' | 'reasoning' | 'memory' | 'diy_engineering' | 'physics_high_voltage' | 'creative' | 'casual';
  suggestedFocus: string;
  domainContext?: string;
}

const TECH_KEYWORDS = [
  'typescript', 'javascript', 'python', 'rust', 'golang', 'c++', 'c#', 'java', 'kotlin', 'swift',
  'react', 'vue', 'angular', 'svelte', 'nextjs', 'vite', 'tailwind', 'css', 'html', 'wasm',
  'docker', 'kubernetes', 'terraform', 'aws', 'gcp', 'cloud run', 'serverless', 'ci/cd',
  'sql', 'postgresql', 'mysql', 'sqlite', 'redis', 'mongodb', 'cassandra', 'kafka', 'rabbitmq',
  'rest', 'graphql', 'grpc', 'websocket', 'api', 'microservice', 'distributed', 'concurrency',
  'async', 'threading', 'mutex', 'lock-free', 'algorithm', 'data structure', 'binary tree',
  'dynamic programming', 'graph', 'hash table', 'btree', 'compiler', 'interpreter', 'ast', 'ebpf'
];

const PHYSICS_HIGH_VOLTAGE_KEYWORDS = [
  'tesla coil', 'tesla coils', 'sgtc', 'sstc', 'drsstc', 'vttc', 'slayer exciter',
  'spark gap', 'spark gaps', 'high voltage', 'secondary coil', 'primary coil',
  'top load', 'toroid', 'toroidal', 'mmc capacitor', 'capacitor bank', 'neon sign transformer',
  'nst', 'obit', 'mot', 'flyback', 'zvs', 'mazzilli', 'induction heater', 'dielectric',
  'resonance', 'resonant frequency', 'lc circuit', 'skin effect', 'corona discharge',
  'streamer', 'breakout point', 'strike rail', 'rf ground', 'counterpoise', 'arc', 'plasma'
];

const DIY_MAKER_ELECTRONICS_KEYWORDS = [
  'arduino', 'esp32', 'esp8266', 'raspberry pi', 'stm32', 'microcontroller',
  'soldering', 'breadboard', 'pcb', 'schematic', 'multimeter', 'oscilloscope',
  'mosfet', 'igbt', 'transistor', 'diode', 'zener', 'rectifier', 'capacitor', 'inductor',
  'resistor', 'potentiometer', 'relay', 'optocoupler', 'op-amp', 'comparator',
  '555 timer', 'pwm', 'duty cycle', 'h-bridge', 'motor driver', 'stepper motor',
  'servo', 'bldc', 'brushless motor', 'esc', 'battery', 'lipo', 'bms', 'buck converter',
  'boost converter', 'linear regulator', 'coilgun', 'gauss rifle', 'railgun', 'sensor'
];

const MECHANICAL_ROBOTICS_KEYWORDS = [
  'robot', 'robotics', 'drone', 'quadcopter', 'flight controller', 'betaflight',
  '3d printer', '3d printing', 'fdm', 'sla', 'gcode', 'slicer', 'pla', 'petg', 'abs',
  'hotend', 'extruder', 'lead screw', 'timing belt', 'linear rail', 'bearing',
  'gear ratio', 'torque', 'rpm', 'stepper driver', 'tmc2209', 'a4988', 'pid controller',
  'kinematics', 'inverse kinematics', 'gyroscope', 'accelerometer', 'imu', 'lidar'
];

const REASONING_KEYWORDS = [
  'why', 'tradeoff', 'compare', 'contrast', 'first principles', 'inversion',
  'analyze', 'evaluate', 'proof', 'deduce', 'logic', 'pros and cons', 'decision',
  'root cause', 'rationale', 'synthesize', 'hypothesis', 'theorem', 'counterfactual'
];

const MATH_SCIENCE_KEYWORDS = [
  'probability', 'bayes', 'derivative', 'integral', 'matrix', 'eigenvalue',
  'vector', 'entropy', 'thermodynamics', 'physics', 'equation', 'formula', 'calculus',
  'maxwell equations', 'electromagnetism', 'quantum', 'fourier transform', 'impedance'
];

const MEMORY_KEYWORDS = [
  'remember', 'recall', 'do you know', 'what is my', 'my name', 'my preference',
  'who am i', 'what did i say', 'my favorite', 'memory graph', 'dump memory'
];

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function analyzeIntent(message: string): IntentAnalysis {
  const lower = message.toLowerCase();

  // Extract entities across all categories
  const detectedEntities: string[] = [];

  for (const tech of TECH_KEYWORDS) {
    if (new RegExp(`(?:^|\\W)${escapeRegex(tech)}(?:$|\\W)`, 'i').test(lower)) {
      detectedEntities.push(tech);
    }
  }

  for (const phys of PHYSICS_HIGH_VOLTAGE_KEYWORDS) {
    if (lower.includes(phys)) {
      if (!detectedEntities.includes(phys)) detectedEntities.push(phys);
    }
  }

  for (const diy of DIY_MAKER_ELECTRONICS_KEYWORDS) {
    if (new RegExp(`(?:^|\\W)${escapeRegex(diy)}(?:$|\\W)`, 'i').test(lower)) {
      if (!detectedEntities.includes(diy)) detectedEntities.push(diy);
    }
  }

  for (const mech of MECHANICAL_ROBOTICS_KEYWORDS) {
    if (new RegExp(`(?:^|\\W)${escapeRegex(mech)}(?:$|\\W)`, 'i').test(lower)) {
      if (!detectedEntities.includes(mech)) detectedEntities.push(mech);
    }
  }

  // Check for proper names or user mentions
  const nameMatch = lower.match(/(?:my name is|i am|call me)\s+([a-zA-Z]+)/);
  if (nameMatch && nameMatch[1]) {
    detectedEntities.push(`user:${nameMatch[1]}`);
  }

  // Determine intent & task type
  let intent = 'general_inquiry';
  let taskType: IntentAnalysis['taskType'] = 'explanation';
  let suggestedFocus = 'Provide clear, well-structured, actionable information';
  let domainContext: string | undefined = undefined;

  if (PHYSICS_HIGH_VOLTAGE_KEYWORDS.some(k => lower.includes(k))) {
    intent = 'high_voltage_physics_engineering';
    taskType = 'physics_high_voltage';
    domainContext = 'High Voltage Physics & Resonant Transformers';
    suggestedFocus = 'Detail resonant principles, step-by-step assembly, exact components, tuning formulas, and critical high-voltage safety rules.';
  } else if (DIY_MAKER_ELECTRONICS_KEYWORDS.some(k => lower.includes(k)) || MECHANICAL_ROBOTICS_KEYWORDS.some(k => lower.includes(k))) {
    intent = 'diy_electronics_maker_hardware';
    taskType = 'diy_engineering';
    domainContext = 'DIY Electronics, Embedded Hardware & Robotics';
    suggestedFocus = 'Provide complete schematics, component ratings, pinouts, wiring diagrams, microcontroller code, and assembly advice.';
  } else if (MEMORY_KEYWORDS.some(k => lower.includes(k))) {
    intent = 'memory_query';
    taskType = 'memory';
    suggestedFocus = 'Query conversational memory graph for personalized context';
  } else if (
    lower.includes('code') ||
    lower.includes('function') ||
    lower.includes('implement') ||
    lower.includes('refactor') ||
    lower.includes('debug') ||
    lower.includes('class') ||
    detectedEntities.length >= 2
  ) {
    intent = 'code_generation_analysis';
    taskType = 'coding';
    suggestedFocus = 'Deliver idiomatic, strongly-typed, production-ready code with edge case handling';
  } else if (
    lower.includes('architecture') ||
    lower.includes('system design') ||
    lower.includes('scale') ||
    lower.includes('throughput') ||
    lower.includes('distributed')
  ) {
    intent = 'system_architecture';
    taskType = 'system_design';
    suggestedFocus = 'Analyze component topology, latency, bottlenecks, and fault tolerance';
  } else if (MATH_SCIENCE_KEYWORDS.some(k => lower.includes(k))) {
    intent = 'mathematical_scientific_reasoning';
    taskType = 'reasoning';
    suggestedFocus = 'Formulate step-by-step rigorous analytical deduction with mathematical precision';
  } else if (REASONING_KEYWORDS.some(k => lower.includes(k))) {
    intent = 'critical_reasoning_comparison';
    taskType = 'reasoning';
    suggestedFocus = 'Deconstruct into first principles, analyze counterfactuals, and evaluate trade-offs';
  } else if (
    /^(hi|hello|hey|greetings|good morning|good afternoon|howdy|sup)\b/i.test(lower.trim()) ||
    lower.trim() === 'how are you?' ||
    lower.trim() === 'who are you?'
  ) {
    intent = 'casual_greeting';
    taskType = 'casual';
    suggestedFocus = 'Friendly, concise, ready to assist with high-performance computation';
  } else if (lower.includes('explain') || lower.includes('describe') || lower.includes('what is') || lower.includes('how to') || lower.includes('cap theorem')) {
    intent = 'conceptual_explanation';
    taskType = 'explanation';
    suggestedFocus = 'Provide structured conceptual breakdown with concrete architectural principles';
  }

  // Complexity estimation
  let complexityScore = 2;
  const wordCount = message.split(/\s+/).length;
  if (wordCount > 60 || detectedEntities.length >= 3) complexityScore += 2;
  if (taskType === 'coding' || taskType === 'system_design' || taskType === 'physics_high_voltage' || taskType === 'diy_engineering') complexityScore += 1;
  complexityScore = Math.min(5, Math.max(1, complexityScore));

  // Sentiment
  let sentiment: IntentAnalysis['sentiment'] = 'neutral';
  if (lower.includes('?') || lower.includes('how') || lower.includes('what')) {
    sentiment = 'inquisitive';
  } else if (lower.includes('great') || lower.includes('thanks') || lower.includes('awesome') || lower.includes('excellent')) {
    sentiment = 'positive';
  } else if (lower.includes('bug') || lower.includes('error') || lower.includes('broken') || lower.includes('fail')) {
    sentiment = 'critical';
  }

  return {
    intent,
    detectedEntities,
    complexityScore,
    sentiment,
    taskType,
    suggestedFocus,
    domainContext,
  };
}
