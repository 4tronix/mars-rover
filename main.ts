/**
  * Enumeration of servos
  */
enum eServos
{
    FL=9,
    RL=11,
    RR=13,
    FR=15,
    Mast=0
}

/**
  * Enumeration of directions.
  */
enum eDirection
{
    //% block="left"
    Left,
    //% block="right"
    Right
}

/**
 * Ping unit for sensor
 */
enum ePingUnit
{
    //% block="cm"
    Centimeters,
    //% block="inches"
    Inches,
    //% block="μs"
    MicroSeconds
}

/**
  * Enumeration of motors.
  */
enum eMotor
{
    //% block="left"
    Left,
    //% block="right"
    Right,
    //% block="both"
    Both
}


/**
 * Custom blocks
 */

//% weight=10 color=#e7660b icon="\uf135"
namespace Rover
{
    let PCA = 0x40;	// i2c address of 4tronix Animoid servo controller
    let EEROM = 0x50;	// i2c address of EEROM
    let initI2C = false;
    let SERVOS = 0x06; // first servo address for start byte low
    let leftSpeed = 0;
    let rightSpeed = 0;
    let servoOffset: number[] = [];


// HELPER FUNCTIONS

    /**
      * Return servo number from name
      *
      * @param value servo name
      */
    //% blockId="cu_getServo" block="%value"
    //% weight=80
    export function getServo(value: eServos): number
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

	for (let i=0; i<16; i++)
            servoOffset[i] = readEEROM(i);
    }

    function setPWM(): void
    {
        if ((leftSpeed < 400) || (rightSpeed < 400))
            pins.analogSetPeriod(AnalogPin.P0, 60000);
        else if ((leftSpeed < 600) || (rightSpeed < 600))
            pins.analogSetPeriod(AnalogPin.P0, 40000);
        else
            pins.analogSetPeriod(AnalogPin.P0, 30000);
    }


//  SERVO BLOCKS

    /**
      * Initialise all servos to Angle=0
      */
    //% blockId="cu_zeroServos"
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
    //% blockId="cu_setServo" block="set servo %servo| to angle %angle"
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


// MOTOR BLOCKS

    /**
      * Drive forward (or backward) at speed.
      * @param speed speed of motor between -1023 and 1023. eg: 600
      */
    //% blockId="cu_drive" block="drive Cur06 at speed %speed"
    //% speed.min=-1023 speed.max=1023
    //% weight=110
    export function drive(speed: number): void
    {
        motor(eMotor.Both, speed);
    }


    /**
      * Drive motor(s) forward or reverse.
      * @param motor motor to drive.
      * @param speed speed of motor eg: 600
      */
    //% blockId="cu_motor" block="drive %motor| motor at speed %speed"
    //% weight=100
    export function motor(motor: eMotor, speed: number): void
    {
        let forward = (speed >= 0);
        let absSpeed = Math.abs(speed);
        if ((motor == eMotor.Left) || (motor == eMotor.Both))
            leftSpeed = absSpeed;
        if ((motor == eMotor.Right) || (motor == eMotor.Both))
            rightSpeed = absSpeed;
        setPWM();
        if (speed > 1023)
        {
            speed = 1023;
        }
        else if (speed < -1023)
        {
            speed = -1023;
        }
        let realSpeed = speed;
        if (!forward)
        {
            if (realSpeed >= -200)
                realSpeed = (realSpeed * 19) / 6;
            else if (realSpeed >= -400)
                realSpeed = realSpeed * 2;
            else if (realSpeed >= -600)
                realSpeed = (realSpeed * 3) / 2;
            else if (realSpeed >= -800)
                realSpeed = (realSpeed * 5) / 4;
            realSpeed = 1023 + realSpeed; // realSpeed is negative
        }
        if ((motor == eMotor.Left) || (motor == eMotor.Both))
        {
            pins.analogWritePin(AnalogPin.P0, realSpeed);
            pins.digitalWritePin(DigitalPin.P8, forward ? 0 : 1);
        }
        if ((motor == eMotor.Right) || (motor == eMotor.Both))
        {
            pins.analogWritePin(AnalogPin.P1, realSpeed);
            pins.digitalWritePin(DigitalPin.P12, forward ? 0 : 1);
        }
    }


// SENSOR BLOCKS
    /**
    * Read distance from sonar module
    *
    * @param unit desired conversion unit
    */
    //% blockId="cu_sonar" block="read sonar as %unit"
    //% weight=90
    export function sonar(unit: ePingUnit): number
    {
        // send pulse
        let trig = DigitalPin.P13;
        let echo = DigitalPin.P13;
        let maxCmDistance = 500;
        let d=10;
        pins.setPull(trig, PinPullMode.PullNone);
        for (let x=0; x<10; x++)
        {
            pins.digitalWritePin(trig, 0);
            control.waitMicros(2);
            pins.digitalWritePin(trig, 1);
            control.waitMicros(10);
            pins.digitalWritePin(trig, 0);
            // read pulse
            d = pins.pulseIn(echo, PulseValue.High, maxCmDistance * 58);
            if (d>0)
                break;
        }
        switch (unit)
        {
            case ePingUnit.Centimeters: return d / 58;
            case ePingUnit.Inches: return d / 148;
            default: return d;
        }
    }


// EEROM BLOCKS

    /**
      * Write a byte of data to EEROM at selected address
      * @param address Location in EEROM to write to
      * @param data Byte of data to write
      */
    //% blockId="cu_writeEEROM" block="write %data| to address %address"
    //% data.min = -128 data.max = 127
    export function writeEEROM(data: number, address: number): void
    {
/*        let i2cData = pins.createBuffer(3);

        i2cData[0] = address >> 8;	// address MSB
        i2cData[1] = address & 0xff;	// address LSB
        i2cData[2] = data & 0xff;
        pins.i2cWriteBuffer(EEROM, i2cData, false);
        servoOffset[address] = data;	// update servo offset as well - lazy coding
        basic.pause(1);			// needs a short pause. << 1ms ok?*/
    }

    /**
      * Read a byte of data from EEROM at selected address
      * @param address Location in EEROM to read from
      */
    //% blockId="cu_readEEROM" block="read EEROM address %address"
    export function readEEROM(address: number): number
    {
        return 0;	// no EEROM to read
/*        let i2cRead = pins.createBuffer(2);

        i2cRead[0] = address >> 8;	// address MSB
        i2cRead[1] = address & 0xff;	// address LSB
        pins.i2cWriteBuffer(EEROM, i2cRead, false);
        basic.pause(1);
        return pins.i2cReadNumber(EEROM, NumberFormat.Int8LE);*/
    }

}