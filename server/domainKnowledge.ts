export interface DomainTopicGuide {
  id: string;
  keywords: string[];
  title: string;
  category: 'diy_electronics' | 'physics_high_voltage' | 'robotics_embedded' | 'mechanical_engineering' | 'computer_science' | 'general_science';
  overview: string;
  firstPrinciplesPhysics: string[];
  requiredComponents: Array<{ name: string; specs: string; purpose: string; safetyNote?: string }>;
  stepByStepGuide: Array<{ step: number; title: string; instruction: string; criticalChecks: string[] }>;
  tuningAndCalculations: {
    formula: string;
    explanation: string;
    practicalRule: string;
  };
  safetyProtocols: string[];
  troubleshooting: Array<{ symptom: string; probableCause: string; remedy: string }>;
}

export const DOMAIN_TOPIC_GUIDES: DomainTopicGuide[] = [
  {
    id: 'tesla-coil-comprehensive',
    keywords: [
      'tesla coil', 'tesla coils', 'sgtc', 'sstc', 'drsstc', 'vttc', 'slayer exciter',
      'spark gap', 'spark gaps', 'high voltage', 'secondary coil', 'primary coil',
      'top load', 'toroid', 'toroidal', 'mmc capacitor', 'neon sign transformer',
      'resonant transformer', 'rf resonance', 'make a tesla coil', 'build a tesla coil',
      'how to make a tesla coil', 'how to build a tesla coil'
    ],
    title: 'Comprehensive Engineering Guide: Constructing a Resonant Tesla Coil',
    category: 'physics_high_voltage',
    overview: 'A Tesla Coil is a high-frequency, dual-resonant air-core transformer that steps up moderate AC voltages into hundreds of thousands or millions of volts at radio frequencies (typically 50 kHz to 500 kHz). Unlike iron-core mains transformers that rely on tight magnetic coupling, a Tesla coil relies on resonant energy transfer between a loose-coupled (k ~ 0.1 to 0.2) primary LC tank and a high-Q secondary LC tank.',
    firstPrinciplesPhysics: [
      'Dual Resonance: Both the primary circuit (Lp, Cp) and the secondary circuit (Ls, Cs + Ctop) must be tuned to vibrate at the exact same resonant frequency: f0 = 1 / (2 * π * sqrt(L * C)).',
      'Loose Air-Core Coupling: A coupling coefficient k between 0.12 and 0.20 allows energy to transfer back and forth in "beats" without causing primary-to-secondary electrical flashover (arcing).',
      'High Quality Factor (Q): Secondary coil possesses very high unloaded Q (often 200 - 500), multiplying terminal voltage by Q times during resonant ring-up.',
      'Top Load Field Shielding: The toroidal aluminum top load acts as a distributed capacitance (Cs) while its smooth radius prevents premature corona discharge until peak voltage builds up.',
    ],
    requiredComponents: [
      {
        name: 'High Voltage AC Power Source',
        specs: 'Neon Sign Transformer (NST): 9kV to 15kV AC at 30mA to 60mA (Iron-core only, non-GFI / non-SGFP). Alternatively, Oil Burner Ignition Transformer (OBIT) or Microwave Oven Transformer (MOT with inductive current ballast).',
        purpose: 'Charges the primary capacitor bank on every half-cycle of mains AC voltage.',
        safetyNote: 'Lethal current. NSTs can kill instantly on contact. Always use an earth-grounded metal enclosure and safety interlocks.'
      },
      {
        name: 'Primary Capacitor Bank (MMC)',
        specs: 'Multi-Mini Capacitor (MMC) bank composed of high-pulse polypropylene film capacitors (e.g., WIMA FKP1 or Cornell Dubilier 942C), rated for 15kV - 30kV DC pulse voltage, total capacitance ~10nF to 30nF.',
        purpose: 'Forms the primary resonant LC tank. Each capacitor must have a 10MΩ 1W metal film bleed resistor wired across it for automatic post-power discharge.',
        safetyNote: 'Capacitors can retain lethal charge after power-off if bleed resistors fail.'
      },
      {
        name: 'Primary Coil (Lp)',
        specs: '4 to 8 turns of 1/4 inch (6.35mm) soft refrigeration copper tubing, wound in a flat pancake spiral or 15-degree inverted saucer with 1/4 inch turn-to-turn spacing.',
        purpose: 'Provides low-resistance, high-current (hundreds of amps peak RF) primary inductance. Tapped with a moveable copper alligator or brass lug for fine frequency tuning.',
      },
      {
        name: 'Secondary Coil (Ls)',
        specs: '800 to 1200 tightly wound single-layer turns of 30 to 34 AWG enamelled copper magnet wire on a 3.5" to 4.5" (90mm - 110mm) diameter PVC or acrylic tube. Height-to-diameter aspect ratio roughly 4:1 to 5:1.',
        purpose: 'Develops ultra-high RF potential through high turns ratio and resonant magnification. Coated with 4 to 6 coats of polyurethane varnish to prevent inter-turn insulation breakdown.',
      },
      {
        name: 'Top Load (Terminal Toroid)',
        specs: 'Smooth donut-shaped toroid fabricated from 3" to 4" flexible aluminum ducting wrapped around two metal pie pans, or spun aluminum spheres. Diameter roughly equal to secondary tube length.',
        purpose: 'Adds terminal capacitance (typically 10pF - 25pF) to lower resonant frequency and provides a breakout point for long electrical streamers.',
      },
      {
        name: 'Spark Gap (Switch)',
        specs: 'Static multi-segment copper pipe spark gap with a cooling blower fan, or asynchronous rotary spark gap (RSG) using tungsten electrodes.',
        purpose: 'Acts as a high-speed switch. Once capacitor voltage reaches breakdown threshold, the ionized air conducts, creating an oscillatory RF discharge loop.',
      },
      {
        name: 'RF Dedicated Earth Ground',
        specs: '4-foot to 8-foot copper-plated steel ground rod driven directly into physical outdoor soil with heavy 10 AWG braided wire connected directly to secondary base.',
        purpose: 'Provides return path for secondary RF current. NEVER connect secondary base to household mains electrical ground or neutral wire, as high RF will destroy home appliances.',
        safetyNote: 'Strict rule: Secondary ground MUST be dedicated outdoor earth ground.'
      }
    ],
    stepByStepGuide: [
      {
        step: 1,
        title: 'Wind the Secondary Coil',
        instruction: 'Cut a 4-inch PVC pipe to 20 inches in length. Clean with isopropyl alcohol. Anchor 32 AWG magnet wire at bottom with high-voltage tape. Carefully wind 900 to 1100 turns in a single, tight, non-overlapping layer. Secure the top end. Apply 5 generous coats of clear polyurethane varnish, letting each coat dry for 4 hours to eliminate micro-voids.',
        criticalChecks: ['Zero overlapping turns', 'No gaps between adjacent wires', 'Thorough varnish insulation']
      },
      {
        step: 2,
        title: 'Construct the Toroidal Top Load',
        instruction: 'Form a ring from 4-inch flexible aluminum dryer ducting with an outer diameter matching the secondary height (~16 inches). Join the ends with aluminum tape and sandwich between two 8-inch aluminum pie tins. Connect the top magnet wire of the secondary securely to the center of the toroid with a smooth solder or screw connection.',
        criticalChecks: ['Smooth outer surface with no sharp protruding burrs', 'Solid electrical contact to secondary top wire']
      },
      {
        step: 3,
        title: 'Build the Primary Coil and Base Support',
        instruction: 'Fabricate slotted non-conductive supports (acrylic, HDPE, or varnished wood). Wind 6 to 8 turns of 1/4" copper refrigeration tube in a flat spiral, leaving 1/4" gap between turns. Mount the coil base around the bottom of the secondary tube, ensuring at least 1 to 1.5 inches of clearance between primary inner turn and secondary winding to prevent flashover.',
        criticalChecks: ['Non-conductive supports only (never metal)', 'Adjustable tap clip for tuning inductance']
      },
      {
        step: 4,
        title: 'Assemble the MMC Capacitor Bank',
        instruction: 'Solder 10 to 20 polypropylene capacitors in series/parallel strings on a clean perforated board. Solder a 10MΩ 1W metal-film resistor in parallel across EVERY individual capacitor to ensure safe discharge within seconds after power-off.',
        criticalChecks: ['Bleeder resistors on every capacitor unit', 'High-current copper bus wiring between strings']
      },
      {
        step: 5,
        title: 'Construct the Quenched Spark Gap',
        instruction: 'Mount 4 to 6 short segments of 3/4" copper pipe parallel to each other with 0.5mm to 0.8mm gaps between each pipe on an insulated base. Place a 12V DC cooling fan directly facing the gaps to blow away hot ionized air (quenching the arc between half-cycles).',
        criticalChecks: ['Even spark spacing', 'Active air quenching fan running before HV is engaged']
      },
      {
        step: 6,
        title: 'Connect the RF Ground & Secondary Base',
        instruction: 'Connect the bottom wire of the secondary coil directly to a dedicated 4-foot copper rod driven into the earth outside. Install a strike rail (an unclosed single turn of copper tube grounded to earth) 1 inch above the primary coil to catch stray downward arcs.',
        criticalChecks: ['Strike rail has an open gap (do NOT form a closed shorted turn)', 'Absolute isolation from household mains ground']
      },
      {
        step: 7,
        title: 'Tuning the Primary Tank to Resonant Frequency',
        instruction: 'Using the resonance formula f0 = 1 / (2*π*sqrt(L*C)), calculate theoretical frequency (~250 kHz). Start with the primary tap at turn 5. Apply low power via a Variac transformer. Observe spark breakout at toroid. Slowly move the primary tap half-turn at a time until the spark length reaches its maximum intensity.',
        criticalChecks: ['Power off and discharge capacitors before moving tap', 'Tune for maximum clean streamer length']
      }
    ],
    tuningAndCalculations: {
      formula: 'f_res = 1 / (2 * π * √(L * C))',
      explanation: 'Both primary LC loop (L_primary * C_MMC) and secondary LC loop (L_secondary * (C_self + C_topload)) must equal the same frequency f_0. When resonant, inductive and capacitive reactances cancel out (X_L = X_C), maximizing RF current and voltage magnification.',
      practicalRule: 'Medhurst Formula for secondary self-capacitance: C_self ≈ 0.56 * Diameter_cm (in pF). Toroid capacitance: C_toroid ≈ 1.4 * (1.2781 - (d_tube / D_outer)) * √(SurfaceArea_cm²).'
    },
    safetyProtocols: [
      'Lethal Voltage Danger: Primary circuit carries lethal mains-frequency high current. Never approach or touch any part of the system while powered.',
      'Dedicated RF Earth Ground: Never connect the secondary coil to wall outlet earth ground. RF feed-back will fry connected household electronics.',
      'Ozone and NOx Ventilation: Spark gaps and streamers generate ozone (O3) and nitrogen oxides. Operate only in well-ventilated areas or outdoors.',
      'Electromagnetic Interference (EMP): High RF fields will destroy smartphones, laptops, and pacemakers within a 15-foot radius.',
      'Eye and Hearing Protection: Static spark gaps produce loud acoustic crackling and intense UV radiation. Wear UV-rated polycarbonate safety glasses and ear protection.'
    ],
    troubleshooting: [
      {
        symptom: 'No sparks or very weak brush discharge',
        probableCause: 'Primary and secondary circuits are out of resonance, or spark gap is set too wide/narrow.',
        remedy: 'Adjust primary tap position 1/2 turn at a time. Inspect spark gap spacing and ensure cooling fan is blowing across the gaps.'
      },
      {
        symptom: 'Spark jumping from secondary to primary coil (Primary Flashover)',
        probableCause: 'Coupling coefficient k is too tight (primary too close to secondary) or lack of strike rail.',
        remedy: 'Raise secondary 1/2 inch or widen primary coil diameter. Install an open-loop grounded copper strike rail.'
      },
      {
        symptom: 'Capacitor bank getting hot',
        probableCause: 'Improper dielectric capacitors (e.g. ceramic or polyester) experiencing high dielectric loss at RF frequencies.',
        remedy: 'Replace immediately with pulse-rated polypropylene film capacitors (such as WIMA FKP1 or Cornell Dubilier 942C).'
      }
    ]
  },
  {
    id: 'coilgun-gauss-rifle',
    keywords: [
      'coilgun', 'coil gun', 'gauss rifle', 'electromagnetic accelerator', 'solenoid accelerator',
      'how to make a coil gun', 'build a coilgun', 'scr thyristor'
    ],
    title: 'Electromagnetic Solenoid Accelerator (Coilgun / Gauss Accelerator)',
    category: 'physics_high_voltage',
    overview: 'A coilgun uses sequential electromagnetic solenoids to accelerate a ferromagnetic projectile along a non-magnetic barrel. When a high-energy capacitor discharges into the solenoid coil, a strong magnetic field pulls the projectile towards the coil center. The current must be shut off or depleted precisely at the halfway point to prevent magnetic suck-back.',
    firstPrinciplesPhysics: [
      'Reluctance Acceleration: Ferromagnetic projectile aligns with magnetic flux lines, pulled towards region of highest magnetic flux density.',
      'Suck-Back Prevention: If current persists after projectile passes coil center, magnetic force reverses, decelerating the projectile.',
      'Pulse Forming Network (PFN): LC discharge time t_pulse = π * sqrt(L_coil * C_bank) must match projectile transit time through the coil.'
    ],
    requiredComponents: [
      { name: 'Photoflash / Electrolytic Capacitors', specs: '400V to 450V, 1000µF - 4700µF low ESR', purpose: 'Stores electrical energy for rapid high-current pulse release.' },
      { name: 'High-Current SCR Thyristor', specs: 'e.g. 70TPS12 or stud-mount SCR rated 1200V, 1000A peak pulse', purpose: 'Solid-state high-speed switch to trigger discharge.' },
      { name: 'Flyback / Freewheeling Diode', specs: 'Ultrafast high-voltage diode (e.g. BYV26E or MUR860) across coil', purpose: 'Protects capacitors from reverse inductive kickback voltage.' },
      { name: 'Accelerator Solenoid Coil', specs: '100 to 200 turns of 18 to 22 AWG magnet wire on acrylic/brass barrel', purpose: 'Generates intense magnetic field.' }
    ],
    stepByStepGuide: [
      { step: 1, title: 'Winding the Solenoid Barrel', instruction: 'Wrap 4 to 6 neat layers of 20 AWG magnet wire around a non-magnetic tube (acrylic, polycarbonate, or glass). Coil length ~1.5 inches.', criticalChecks: ['Non-magnetic barrel material', 'Insulated layers with epoxy'] },
      { step: 2, title: 'Building the Charger Circuit', instruction: 'Construct a current-limited DC-DC boost converter stepping 12V battery up to 400V DC with automatic cutoff comparator.', criticalChecks: ['Voltage regulation cutoff at 400V', 'Bleeder resistor across capacitor bank'] },
      { step: 3, title: 'Trigger Switching with SCR', instruction: 'Connect capacitor positive to coil, coil negative to SCR Anode, SCR Cathode to capacitor negative. Wire pulse button to SCR Gate with current limiting resistor.', criticalChecks: ['Reverse diode across coil to clamp inductive flyback', 'Solid heavy gauge wiring for high peak pulse amps'] }
    ],
    tuningAndCalculations: {
      formula: 'E = 0.5 * C * V²',
      explanation: 'Stored energy scales quadratically with voltage. A 2000µF capacitor charged to 400V stores 160 Joules of energy.',
      practicalRule: 'Position projectile at 1/2 barrel length before coil entrance for maximum kinetic impulse.'
    },
    safetyProtocols: [
      '400V capacitor banks store lethal electrical energy. Never touch live terminals.',
      'Always fire towards a dense backstop (e.g., ballistic gel or heavy wood target).',
      'Always install emergency bleed resistors with mechanical safety switch.'
    ],
    troubleshooting: [
      { symptom: 'Projectile stops inside the coil', probableCause: 'Discharge duration too long causing magnetic suck-back.', remedy: 'Decrease capacitance, increase wire gauge, or decrease coil turns to speed up pulse discharge.' }
    ]
  },
  {
    id: 'zvs-flyback-driver',
    keywords: [
      'zvs', 'zvs driver', 'flyback transformer', 'mazzilli driver', 'high voltage arc',
      'plasma arc', 'induction heater', 'make an induction heater', 'build a zvs driver'
    ],
    title: 'Zero Voltage Switching (ZVS) Mazzilli Flyback Driver & Induction Heater',
    category: 'diy_electronics',
    overview: 'The ZVS Mazzilli resonant converter is an efficient, self-oscillating push-pull topology widely used to drive high-voltage flyback transformers and induction heating work coils with zero-voltage switching losses.',
    firstPrinciplesPhysics: [
      'Resonant Push-Pull: Two N-channel MOSFETs cross-coupled through ultrafast diodes switch alternately when the resonant LC tank voltage passes through zero volts.',
      'Zero Voltage Switching (ZVS): Eliminates capacitive turn-on switching losses, allowing high power throughput with minimal transistor heating.'
    ],
    requiredComponents: [
      { name: 'N-Channel Power MOSFETs', specs: '2x IRFP250N or IRFP260N (200V, 30A - 50A, low Rds_on)', purpose: 'Push-pull switching transistors.' },
      { name: 'Ultrafast Diodes', specs: '2x UF4007 or HER108 (Fast recovery < 75ns, 1000V)', purpose: 'Cross-coupling gate discharge to opposite drain.' },
      { name: 'Zener Diodes', specs: '2x 12V or 15V 1W Zener diodes', purpose: 'Protects MOSFET gates from overvoltage breakdown.' },
      { name: 'Resonant Tank Capacitor', specs: 'MKP / Polypropylene film 0.33µF - 0.68µF rated 630V - 1000V', purpose: 'Forms parallel resonant tank with center-tapped transformer primary.' },
      { name: 'Center-Tapped Inductor Choke', specs: 'Toroidal iron-powder core wound with 15-20 turns of 14 AWG wire (47µH - 100µH)', purpose: 'Provides constant-current DC feed to center tap.' }
    ],
    stepByStepGuide: [
      { step: 1, title: 'Mount MOSFETs on Heatsinks', instruction: 'Bolt IRFP250N transistors to large aluminum heatsinks with mica insulating pads and thermal paste.', criticalChecks: ['Electrically isolated drains or separate heatsinks'] },
      { step: 2, title: 'Wire Gate Protection Network', instruction: 'Solder 12V Zener across Gate and Source (Anode to Source). Solder 10kΩ pull-down resistor across Gate and Source. Solder 470Ω 2W resistor from Gate to supply rail.', criticalChecks: ['Correct Zener diode polarity'] },
      { step: 3, title: 'Connect Cross-Coupled Fast Diodes', instruction: 'Solder Cathode of UF4007 to Gate 1, Anode to Drain 2. Solder Cathode of second UF4007 to Gate 2, Anode to Drain 1.', criticalChecks: ['Ultrafast recovery diodes only (1N4007 is too slow and will destroy MOSFETs)'] },
      { step: 4, title: 'Wind Flyback Primary', instruction: 'Wind 5+5 turns of 14 AWG silicone wire with center tap on flyback ferrite core. Connect outer legs across Drain 1 and Drain 2 in parallel with MKP capacitor. Connect center tap through inductor choke to 12V-24V DC power supply.', criticalChecks: ['MKP pulse capacitor only', 'Inductor choke on power rail'] }
    ],
    tuningAndCalculations: {
      formula: 'f_res = 1 / (2 * π * √(L_primary * C_tank))',
      explanation: 'Typically oscillates between 20 kHz and 100 kHz depending on tank capacitor and primary coil inductance.',
      practicalRule: 'Use 24V 10A-20A power supply for 3-5 cm thick hot plasma arcs or rapid steel glowing in induction work coil.'
    },
    safetyProtocols: [
      'Produces high-voltage AC arcs capable of severe RF burns and electrical shock.',
      'Ferrite cores and capacitors generate significant heat under continuous load; do not run uncooled for > 2 minutes.',
      'Ensure adequate ventilation for ozone and ionized air.'
    ],
    troubleshooting: [
      { symptom: 'MOSFETs blow immediately on power up', probableCause: 'Slow diodes used instead of ultrafast UF4007, or inadequate gate pull-up resistance.', remedy: 'Use verified UF4007/HER108 ultrafast diodes and verify gate voltage with oscilloscope.' }
    ]
  }
];

export function findDomainTopic(query: string): DomainTopicGuide | null {
  const lower = query.toLowerCase().trim();

  for (const topic of DOMAIN_TOPIC_GUIDES) {
    for (const kw of topic.keywords) {
      if (lower.includes(kw)) {
        return topic;
      }
    }
  }

  return null;
}
