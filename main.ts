/**
  * Enumeration of servos
  */
enum Servos
{
    FL_Hip,
    FL_Knee,
    RL_Hip,
    RL_Knee,
    RR_Hip,
    RR_Knee,
    FR_Hip,
    FR_Knee,
    Head,
    Tail
}

/**
  * Enumeration of limbs
  */
enum Limbs
{
    FrontLeft,
    RearLeft,
    RearRight,
    FrontRight
}

/**
  * Enumeration of servo enable states
  */
enum States
{
    Enable,
    Disable
}

/**
  * Enumeration of directions.
  */
enum RBRobotDirection
{
    //% block="left"
    Left,
    //% block="right"
    Right
}


/**
 * Custom blocks
 */

//% weight=10 color=#e7660b icon="\uf188"
namespace Rover
{
    let PCA = 0x40;	// i2c address of 4tronix Animoid servo controller
    let EEROM = 0x50;	// i2c address of EEROM
    let initI2C = false;
    let SERVOS = 0x06; // first servo address for start byte low
    let lLower = 57;	// distance from servo shaft to tip of leg/foot
    let lUpper = 46;	// distance between servo shafts
    let lLower2 = lLower * lLower;	// no point in doing this every time
    let lUpper2 = lUpper * lUpper;
    let gait: number[][][] = [];	// array of foot positions for each foot and each of 16 Beats
    let upDown: number[] = [];		// array of Up and down beat numbers for each foot
    let gInit = false;
    let radTOdeg = 180 / Math.PI;
    let servoOffset: number[] = [];

    let nBeats = 16;	// number of beats in a cycle
    let _height = 50;	// default standing height of lowered legs
    let _raised = 40;	// default height of raised legs
    let _stride = 80;	// total distance moved in one cycle
    let _offset = 20;	// forward-most point of leg
    let _delay = 20;	// ms to pause at end of each beat

    // Helper functions

    /**
      * Enable/Disable Servos
      *
      * @param state Select Enabled or Disabled
      */
    //% blockId="enableServos" block="%state all 01 servos"
    //% weight=90
    export function enableServos(state: States): void
    {
        pins.digitalWritePin(DigitalPin.P16, state);
    }

    /**
      * Create and Initialise the gait array
      * 4 limbs, 2 dimensions (x, height), 16 steps
      */
    function initGait(): void
    {
        if (! gInit)
        {
            gInit = true;
            // create all array elements
            for (let i=0; i<4; i++)
            {
                gait[i] = [];
                for (let j=0; j<2; j++)
                    gait[i][j] = [];
            }
            // initialise with standard walking gait
            upDown[0] = 4;	// left front
            upDown[1] = 0;
            upDown[2] = 0;	// left rear
            upDown[3] = 12;
            upDown[4] = 8;	// right rear
            upDown[5] = 4;
            upDown[6] = 12;	// right front
            upDown[7] = 8;
            configureGait();
        }
    }

    /**
      * Create detailed foot patterns from current settings and gait
      */
    function configureGait(): void
    {
        for (let i=0; i<4; i++)
            setGait(i, upDown[i*2], upDown[i*2+1]);
    }

    /**
      * Define gait default (leg down) and raised heights
      * @param height height of body when legs down eg: 50
      * @param raised height of raised leg. eg: 40
      */
    //% blockId="an_setHeights" block="set lowered %height|mm raised %raised|mm"
    export function setHeights(height: number, raised: number): void
    {
        _height = height;
        _raised = raised;
        initGait();
        configureGait();
    }

    /**
      * Define Gait distances and speeds
      * @param stride Sets length in mm of complete sequence. eg: 80
      * @param offset Distance from centre of hip that foot is placed down. eg: 20
      * @param delay Time delay ms between beats. eg: 20
      */
    //% blockId="an_configGait" block="set stride %stride|mm offset %offset|mm delay %delay|ms"
    //% stride.min=0
    //% delay.min=0
    export function configGait(stride: number, offset: number, delay: number): void
    {
        _stride = stride;
        _offset = offset;
        _delay = delay;
        initGait();
        configureGait();
    }


    /**
      * Define Gait up/down positions
      * @param limb Determines which limb is being defined eg. FrontLeft
      * @param gDown beat number (0 to 15) that the leg is first put down
      * @param gUp beat number (0 to 15) that the leg is first lifted up
      */
    //% blockId="an_setGait" block="set %limb=an_limbs| down at %gDown| up at %gUp"
    //% gDown.min=0 gDown.max=15
    //% gUp.min=0 gUp.max=15
    export function setGait(limb: number, gDown: number, gUp: number): void
    {
        let tUp = gDown - gUp;		// number of beats leg is raised
        if (tUp<0)
            tUp += nBeats;		// fix for gDown earlier than gUp
        let tDown = nBeats - tUp;	// number of beats leg is down

        let rStep = _stride/nBeats;			// distance moved backwards per mini-step to move forward
        let fStep = (_stride/nBeats)*(tDown/tUp);	// distance moved forward per mini-step for raised leg
        
        initGait();
        for (let i=0; i < tUp; i++)			// set mini-steps for raised forward movement of leg
        {
            let j = (i + gUp) % nBeats;			// wrap round at end of array
            gait[limb][0][j] = _raised;			// set height of raised leg
            gait[limb][1][j] = _offset - _stride*(tDown/nBeats) + (i * fStep);	// set x position of leg
        }
        for (let i=0; i < tDown; i++)			// set mini-steps for down rearward movement of leg
        {
            let j = (i + gDown) % nBeats;		// wrap round at end of array
            gait[limb][0][j] = _height;			// set height of down leg
            gait[limb][1][j] = _offset - (i * rStep);	// set x position of leg
        }
    }

   /**
      * Walk a fixed number of steps using selected Gait
      * @param steps Number of steps to walk. eg: 1
      */
    //% blockId="an_walk"
    //% block
    //% steps.min=1
    export function walk(steps: number): void
    {
        initGait();	// ensure we have at least the default gait setup
        for (let count=0; count<steps; count++)
        {
            for (let i=0; i<nBeats; i++)
            {
                for (let j=0; j<4; j++)	// for each limb
                {
                    setLimb(j, gait[j][1][i], gait[j][0][i]);
                }
                basic.pause(_delay);
            }
        }
    }

    /**
      * Return servo number from name
      *
      * @param value servo name
      */
    //% blockId="getServo" block="%value"
    //% weight=80
    export function getServo(value: Servos): number
    {
        return value;
    }

    // initialise the servo driver and the offset array values
    function initPCA(): void
    {

        let i2cData = pins.createBuffer(2);
        initI2C = true;

        i2cData[0] = 0;		// Mode 1 register
        i2cData[1] = 0x10;	// put to sleep
        pins.i2cWriteBuffer(PCA, i2cData, false);

        i2cData[0] = 0xFE;	// Prescale register
        i2cData[1] = 101;	// set to 60 Hz
        pins.i2cWriteBuffer(PCA, i2cData, false);

        i2cData[0] = 0;		// Mode 1 register
        i2cData[1] = 0x81;	// Wake up
        pins.i2cWriteBuffer(PCA, i2cData, false);

        for (let servo=0; servo<16; servo++)
        {
            i2cData[0] = SERVOS + servo*4 + 0;	// Servo register
            i2cData[1] = 0x00;			// low byte start - always 0
            pins.i2cWriteBuffer(PCA, i2cData, false);

            i2cData[0] = SERVOS + servo*4 + 1;	// Servo register
            i2cData[1] = 0x00;			// high byte start - always 0
            pins.i2cWriteBuffer(PCA, i2cData, false);
        }

	pins.digitalWritePin(DigitalPin.P16, 0);	// enable servos at start

	for (let i=0; i<16; i++)
            servoOffset[i] = readEEROM(i);
    }

    /**
      * Initialise all servos to Angle=0
      */
    //% blockId="an_zeroServos"
    //% block
    export function zeroServos(): void
    {
        for (let i=0; i<16; i++)
            setServo(i, 0);
    }

    /**
      * Set Servo Position by Angle
      * @param servo Servo number (0 to 15)
      * @param angle degrees to turn servo (-90 to +90)
      */
    //% blockId="an_setServo" block="set servo %servo| to angle %angle"
    //% weight = 70
    export function setServo(servo: number, angle: number): void
    {
        if (initI2C == false)
        {
            initPCA();
        }
        // two bytes need setting for start and stop positions of the servo
        // servos start at SERVOS (0x06) and are then consecutive blocks of 4 bytes
        // the start position (always 0x00) is set during init for all servos
        // the zero offset for each servo is read during init into the servoOffset array

        let i2cData = pins.createBuffer(2);
        let start = 0;
        let stop = 369 + (angle + servoOffset[servo]) * 223 / 90;

        i2cData[0] = SERVOS + servo*4 + 2;	// Servo register
        i2cData[1] = (stop & 0xff);		// low byte stop
        pins.i2cWriteBuffer(PCA, i2cData, false);

        i2cData[0] = SERVOS + servo*4 + 3;	// Servo register
        i2cData[1] = (stop >> 8);		// high byte stop
        pins.i2cWriteBuffer(PCA, i2cData, false);
    }

    /**
      * Get numeric value of Limb
      * @param limb name of limb eg FrontLeft
      */
    //% blockId="an_limbs" block=%limb
    export function limbNum(limb: Limbs): number
    {
        return limb;
    }

    /**
      * Set Position of Foot in mm from hip servo shaft
      * Inverse kinematics from learnaboutrobots.com/inverseKinematics.htm
      * @param limb Determines which limb to move. eg. FrontLeft
      * @param xpos Position on X-axis in mm
      * @param height Height of hip servo shaft above foot. eg: 60
      */
    //% blockId="setLimb" block="set %limb=an_limbs| to position %xpos|(mm) height %height|(mm)"
    //% weight = 60
    export function setLimb(limb: number, xpos: number, height: number): void
    {
        let B2 = xpos*xpos + height*height;	// from: B2 = Xhand2 + Yhand2
        let q1 = Math.atan2(height, xpos);	// from: q1 = ATan2(Yhand/Xhand)
        let q2 = Math.acos((lUpper2 - lLower2 + B2) / (2 * lUpper * Math.sqrt(B2)));
        let hip = Math.floor((q1 + q2)*radTOdeg);	// convert from radians to integer degrees
        let k = Math.acos((lUpper2 + lLower2 - B2) / (2 * lUpper * lLower));
        let knee = Math.floor(k*radTOdeg);
	if (limb < 2)
        {
            hip = hip - 90;
            knee = knee - 90;
        }
        else
        {
            hip = 90 - hip;
            knee = 90 - knee;
        }
        setServo(limb * 2, hip);
        setServo(limb*2 + 1, knee);
    }

    /**
      * Write a byte of data to EEROM at selected address
      * @param address Location in EEROM to write to
      * @param data Byte of data to write
      */
    //% blockId="writeEEROM" block="write %data| to address %address"
    //% data.min = -128 data.max = 127
    export function writeEEROM(data: number, address: number): void
    {
        let i2cData = pins.createBuffer(3);

        i2cData[0] = address >> 8;	// address MSB
        i2cData[1] = address & 0xff;	// address LSB
        i2cData[2] = data & 0xff;
        pins.i2cWriteBuffer(EEROM, i2cData, false);
        servoOffset[address] = data;	// update servo offset as well - lazy coding
        basic.pause(1);			// needs a short pause. << 1ms ok?
    }

    /**
      * Read a byte of data from EEROM at selected address
      * @param address Location in EEROM to read from
      */
    //% blockId="readEEROM" block="read EEROM address %address"
    export function readEEROM(address: number): number
    {
        let i2cRead = pins.createBuffer(2);

        i2cRead[0] = address >> 8;	// address MSB
        i2cRead[1] = address & 0xff;	// address LSB
        pins.i2cWriteBuffer(EEROM, i2cRead, false);
        basic.pause(1);
        return pins.i2cReadNumber(EEROM, NumberFormat.Int8LE);
    }

}