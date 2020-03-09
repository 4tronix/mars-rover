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
  * Enumeration of servo groups
  */
enum eServoGroup
{
    //% block="wheel"
    Wheel,
    //% block="mast"
    Mast,
    //% block="all"
    All
}

/**
  * Enumeration of left/right directions
  */
enum eDirection
{
    //% block="left"
    Left,
    //% block="right"
    Right
}

/**
  * Enumeration of forward/reverse directions
  */
enum eVector
{
    //% block="forward"
    Forward,
    //% block="reverse"
    Reverse
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
  * Stop modes. Coast or Brake
  */
enum eStopMode
{
    //% block="no brake"
    Coast,
    //% block="brake"
    Brake
}

/**
  * Update mode for LEDs
  * setting to Manual requires show LED changes blocks
  * setting to Auto will update the LEDs every time they change
  */
enum eUpdateMode
{
    Manual,
    Auto
}

/**
  * Pre-Defined LED colours
  */
enum eColors
{
    //% block=red
    Red = 0xff0000,
    //% block=orange
    Orange = 0xffa500,
    //% block=yellow
    Yellow = 0xffff00,
    //% block=green
    Green = 0x00ff00,
    //% block=blue
    Blue = 0x0000ff,
    //% block=indigo
    Indigo = 0x4b0082,
    //% block=violet
    Violet = 0x8a2be2,
    //% block=purple
    Purple = 0xff00ff,
    //% block=white
    White = 0xffffff,
    //% block=black
    Black = 0x000000
}

/**
  * Keypad keys
  */
enum eKeys
{
    //% block="stop"
    kStop=0b0000000010000000,
    //% block="forward"
    kForward=0b0000010000000000,
    //% block="reverse"
    kReverse=0b0000000000010000,
    //% block="forward left"
    kForwardLeft=0b0000001000000000,
    //% block="forward right"
    kForwardRight=0b0000100000000000,
    //% block="reverse left"
    kReverseLeft=0b0000000000001000,
    //% block="reverse right"
    kReverseRight=0b0000000000100000,
    //% block="spin left"
    kSpinLeft=0b0000000001000000,
    //% block="spin right"
    kSpinRight=0b0000000100000000,
    //% block="mast left"
    kMastLeft=0b1000000000000000,
    //% block="mast right"
    kMastRight=0b0100000000000000,
    //% block="cross"
    kCross=0b0000000000000100,
    //% block="tick"
    kTick=0b0000000000000010,
    //% block="pause"
    kPause=0b0000000000000001,
    //% block="save"
    kSave=0b0010000000000000,
    //% block="load"
    kLoad=0b0001000000000000
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
    let neoStrip: neopixel.Strip;
    let _updateMode = eUpdateMode.Auto;


// HELPER FUNCTIONS

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

	loadOffsets();
    }

    // slow PWM frequency for slower speeds to improve torque
    // only one PWM frequency available for all pins
    function setPWM(speed: number): void
    {
        if (speed < 200)
            pins.analogSetPeriod(AnalogPin.P0, 60000);
        else if (speed < 300)
            pins.analogSetPeriod(AnalogPin.P0, 40000);
        else
            pins.analogSetPeriod(AnalogPin.P0, 30000);
    }


//  SERVO BLOCKS

    /**
      * Initialise wheel/mast/all servos to Angle=0
      * param group which group of servos to centre
      */
    //% blockId="zeroServos"
    //% block="Centre %group| servos"
    //% weight=100
    //% subcategory=Servos
    export function zeroServos(group: eServoGroup): void
    {
        switch(group)
        {
        case eServoGroup.Wheel:
            setServo(getServoNumber(eServos.FL), 0);
            setServo(getServoNumber(eServos.FR), 0);
            setServo(getServoNumber(eServos.RL), 0);
            setServo(getServoNumber(eServos.RR), 0);
            break;
        case eServoGroup.Mast:
            setServo(getServoNumber(eServos.Mast), 0);
            break;
        default:
            for (let i=0; i<16; i++)
                setServo(i, 0);
            break;
        }
    }

    /**
      * Steer all wheels left or right by angle
      * @param direction left or right
      * @param angle angle to steer
      */
    //% blockId="e_steer"
    //% block="steer %direction| by angle %angle"
    //% weight=90
    //% subcategory=Servos
    export function steer(direction: eDirection, angle: number): void
    { 
        angle = Math.max(Math.min(90, angle),0);
        if (direction==eDirection.Left)
            angle = 0-angle;
        setServo(getServoNumber(eServos.FL), angle);
        setServo(getServoNumber(eServos.FR), angle);
        setServo(getServoNumber(eServos.RL), 0-angle);
        setServo(getServoNumber(eServos.RR), 0-angle);
    }

    /**
      * Set individual Servo Position by Angle
      * @param servo Servo number (0 to 15)
      * @param angle degrees to turn servo (-90 to +90)
      */
    //% blockId="setServo"
    //% block="set servo %servo=e_servos| to angle %angle"
    //% weight=80
    //% subcategory=Servos
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
        if (angle > 90)
            angle = 90;
        if (angle < -90)
            angle = -90;
        let stop = 369 + (angle + servoOffset[servo]) * 223 / 90;

        i2cData[0] = SERVOS + servo*4 + 2;	// Servo register
        i2cData[1] = (stop & 0xff);		// low byte stop
        pins.i2cWriteBuffer(PCA, i2cData, false);

        i2cData[0] = SERVOS + servo*4 + 3;	// Servo register
        i2cData[1] = (stop >> 8);		// high byte stop
        pins.i2cWriteBuffer(PCA, i2cData, false);
    }

    /**
      * Return servo number from name
      *
      * @param value servo name
      */
    //% blockId="e_servos"
    //% block="%value"
    //% weight=70
    //% subcategory=Servos
    export function getServoNumber(value: eServos): number
    {
        return value;
    }

    /**
      * Set Servo Offset. Does not save to EEROM
      * @param servo Servo number (0 to 15)
      * @param angle degrees to turn servo (-90 to +90)
      */
    //% blockId="setOffset"
    //% block="set offset of servo %servo=e_servos| to %offset"
    //% weight=60
    //% subcategory=Servos
    export function setOffset(servo: number, offset: number): void
    {
        servo = Math.max(Math.min(15, servo),0);
        servoOffset[servo] = offset;
    }

    /**
      * Get Servo Offset from memory. Does not load from EEROM
      * @param servo Servo number (0 to 15)
      */
    //% blockId="getOffset"
    //% block="get offset of servo %servo=e_servos"
    //% weight=55
    //% subcategory=Servos
    export function getOffset(servo: number): number
    {
        servo = Math.max(Math.min(15, servo),0);
        return servoOffset[servo];
    }

    /**
      * Clear all Servo Offsets (does not save to EEROM)
      */
    //% blockId="clearOffsets"
    //% block="clear all servo offsets"
    //% weight=50
    //% subcategory=Servos
    export function clearOffsets(): void
    {
        for (let i=0; i<16; i++)
            servoOffset[i] = 0;
    }

// MOTOR BLOCKS

    /**
      * Drive forward (or backward) at selected speed
      * @param direction select forwards or reverse
      * @param speed speed of motor between 0 and 100. eg: 60
      */
    //% blockId="e_move"
    //% block="move %direction| at speed %speed"
    //% speed.min=0 speed.max=100
    //% weight=100
    //% subcategory=Motors
    export function move(direction: eVector, speed: number): void
    {
        speed = Math.max(Math.min(100, speed),0);
        motor(eMotor.Both, direction, speed);
    }

    /**
      * Drive forward (or backward) at selected speed for milliseconds
      * @param direction select forwards or reverse
      * @param speed speed of motor between 0 and 100. eg: 60
      * @param millis duration in milliseconds to move, then stop. eg: 400
      */
    //% blockId="e_move_milli"
    //% block="move %direction| at speed %speed| for %millis|(ms)"
    //% speed.min=0 speed.max=100
    //% weight=90
    //% subcategory=Motors
    export function move_milli(direction: eVector, speed: number, millis: number): void
    {
        speed = Math.max(Math.min(100, speed),0);
        motor(eMotor.Both, direction, speed);
        basic.pause(millis);
        stop(eStopMode.Coast);
    }

    /**
      * Stop rover by coasting slowly to a halt or braking
      * @param mode Brakes on or off
      */
    //% blockId="rover_stop" block="stop with %mode"
    //% weight=80
    //% subcategory=Motors
    export function stop(mode: eStopMode): void
    {
        let stopMode = 0;
        if (mode == eStopMode.Brake)
            stopMode = 1;
        pins.digitalWritePin(DigitalPin.P1, stopMode);
        pins.digitalWritePin(DigitalPin.P12, stopMode);
        pins.digitalWritePin(DigitalPin.P8, stopMode);
        pins.digitalWritePin(DigitalPin.P0, stopMode);
    }

    /**
      * Drive motors forward or reverse.
      * @param motor motor to drive.
      * @param direction select forwards or reverse
      * @param speed speed of motor eg: 60
      */
    //% blockId="motor"
    //% block="drive %motor| motors %direction| at speed %speed"
    //% weight=70
    //% speed.min=0 speed.max=100
    //% subcategory=Motors
    export function motor(motor: eMotor, direction: eVector, speed: number): void
    {
        speed = Math.max(Math.min(100, speed),0) * 10.23;
        let speed0 = 0;
        let speed1 = 0;
        setPWM(speed);
        if (direction == eVector.Forward)
        {
            speed0 = speed;
            speed1 = 0;
        }
        else // must be Reverse
        {
            speed0 = 0;
            speed1 = speed;
        }
        if ((motor == eMotor.Left) || (motor == eMotor.Both))
        {
            pins.analogWritePin(AnalogPin.P1, speed0);
            pins.analogWritePin(AnalogPin.P12, speed1);
        }

        if ((motor == eMotor.Right) || (motor == eMotor.Both))
        {
            pins.analogWritePin(AnalogPin.P8, speed0);
            pins.analogWritePin(AnalogPin.P0, speed1);
        }
    }


    /**
      * Spin Left or Right at Speed
      * @param direction left or right
      * @param speed from 0 to 100. eg: 60
      */
    //% blockId="e_spin"
    //% block="spin %direction| at speed %speed"
    //% weight=85
    //% subcategory=Motors
    export function spin(direction: eDirection, speed: number): void
    { 
        speed=Math.max(Math.min(100, speed),0);
        setServo(getServoNumber(eServos.FL), 45);
        setServo(getServoNumber(eServos.FR), -45);
        setServo(getServoNumber(eServos.RL), -45);
        setServo(getServoNumber(eServos.RR), 45);
        if (direction==eDirection.Left)
        {
            motor(eMotor.Left, eVector.Reverse, speed);
            motor(eMotor.Right, eVector.Forward, speed);
        }
        else
        {
            motor(eMotor.Left, eVector.Forward, speed);
            motor(eMotor.Right, eVector.Reverse, speed);
        }
    }

// SENSOR BLOCKS
    /**
    * Read distance from sonar module
    *
    * @param unit desired conversion unit
    */
    //% blockId="readSonar"
    //% block="read sonar as %unit"
    //% weight=100
    //% subcategory=Sensors
    export function readSonar(unit: ePingUnit): number
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
    //% blockId="writeEEROM"
    //% block="write %data| to address %address"
    //% data.min = -128 data.max = 127
    //% weight=100
    //% subcategory=EEROM
    export function writeEEROM(data: number, address: number): void
    {
        wrEEROM(data, address + 16);
    }

    // Uses bottom 16 bytes of EEROM for servo offsets. No user access
    function wrEEROM(data: number, address: number): void
    {
        let i2cData = pins.createBuffer(3);

        i2cData[0] = address >> 8;	// address MSB
        i2cData[1] = address & 0xff;	// address LSB
        i2cData[2] = data & 0xff;
        pins.i2cWriteBuffer(EEROM, i2cData, false);
        basic.pause(1);			// needs a short pause. << 1ms ok?
    }

    /**
      * Read a byte of data from EEROM at selected address
      * @param address Location in EEROM to read from
      */
    //% blockId="readEEROM"
    //% block="read EEROM address %address"
    //% weight=90
    //% subcategory=EEROM
    export function readEEROM(address: number): number
    {
        return rdEEROM(address + 16);
    }

    // Uses bottom 16 bytes of EEROM for servo offsets. No user access
    function rdEEROM(address: number): number
    {
        let i2cRead = pins.createBuffer(2);

        i2cRead[0] = address >> 8;	// address MSB
        i2cRead[1] = address & 0xff;	// address LSB
        pins.i2cWriteBuffer(EEROM, i2cRead, false);
        basic.pause(1);
        return pins.i2cReadNumber(EEROM, NumberFormat.Int8LE);
    }

    /**
      * Load servo offsets from EEROM
      */
    //% blockId="loadOffsets"
    //% block="Load servo offsets from EEROM"
    //% weight=80
    //% subcategory=EEROM
    export function loadOffsets(): void
    {
	for (let i=0; i<16; i++)
            servoOffset[i] = rdEEROM(i);
    }

    /**
      * Save servo offsets to EEROM
      */
    //% blockId="saveOffsets"
    //% block="Save servo offsets to EEROM"
    //% weight=70
    //% subcategory=EEROM
    export function saveOffsets(): void
    {
	for (let i=0; i<16; i++)
            wrEEROM(servoOffset[i],i);
    }


// LED Blocks

    // create a neopixel strip if not got one already. Default to brightness 40
    function neo(): neopixel.Strip
    {
        if (!neoStrip)
        {
            neoStrip = neopixel.create(DigitalPin.P2, 4, NeoPixelMode.RGB);
            neoStrip.setBrightness(40);
        }
        return neoStrip;
    }

    // update LEDs if _updateMode set to Auto
    function updateLEDs(): void
    {
        if (_updateMode == eUpdateMode.Auto)
            neo().show();
    }

    /**
      * Sets all LEDs to a given color (range 0-255 for r, g, b).
      * @param rgb RGB color of the LED
      */
    //% blockId="set_led_color"
    //% block="set all LEDs to %rgb=e_colours"
    //% weight=100
    //% subcategory=LEDs
    export function setLedColor(rgb: number)
    {
        neo().showColor(rgb);
        updateLEDs();
    }

    /**
      * Clear all leds.
      */
    //% blockId="led_clear"
    //% block="clear all LEDs"
    //% weight=90
    //% subcategory=LEDs
    export function ledClear(): void
    {
        neo().clear();
        updateLEDs();
    }

    /**
     * Set single LED to a given color (range 0-255 for r, g, b).
     *
     * @param ledId position of the LED (0 to 11)
     * @param rgb RGB color of the LED
     */
    //% blockId="set_pixel_color"
    //% block="set LED at %ledId|to %rgb=e_colours"
    //% weight=80
    //% subcategory=LEDs
    export function setPixelColor(ledId: number, rgb: number): void
    {
        neo().setPixelColor(ledId, rgb);
        updateLEDs();
    }

    /**
     * Set the brightness of the LEDs
     * @param brightness a measure of LED brightness in 0-255. eg: 40
     */
    //% blockId="led_brightness"
    //% block="set LED brightness %brightness"
    //% brightness.min=0 brightness.max=255
    //% weight=70
    //% subcategory=LEDs
    export function ledBrightness(brightness: number): void
    {
        neo().setBrightness(brightness);
        updateLEDs();
    }

    /**
      * Shows a rainbow pattern on all LEDs.
      */
    //% blockId="led_rainbow"
    //% block="set led rainbow"
    //% weight=60
    //% subcategory=LEDs
    export function ledRainbow(): void
    {
        neo().showRainbow(1, 360);
        updateLEDs()
    }

    /**
      * Get numeric value of colour
      *
      * @param color Standard RGB Led Colours
      */
    //% blockId="e_colours"
    //% block=%color
    //% weight=50
    //% subcategory=LEDs
    export function eColours(color: eColors): number
    {
        return color;
    }

// Advanced blocks

    /**
      * Set LED update mode (Manual or Automatic)
      * @param updateMode setting automatic will show LED changes automatically
      */
    //% blockId="set_updateMode"
    //% block="set %updateMode|update mode"
    //% weight=40
    //% subcategory=LEDs
    //% deprecated=true
    export function setUpdateMode(updateMode: eUpdateMode): void
    {
        _updateMode = updateMode;
    }

    /**
      * Show LED changes
      */
    //% blockId="led_show"
    //% block="show LED changes"
    //% weight=30
    //% subcategory=LEDs
    //% deprecated=true
    export function ledShow(): void
    {
        neo().show();
    }

    /**
     * Rotate LEDs forward.
     */
    //% blockId="led_rotate"
    //% block="rotate LEDs"
    //% weight=20
    //% subcategory=LEDs
    //% deprecated=true
    export function ledRotate(): void
    {
        neo().rotate(1);
        updateLEDs()
    }

    /**
     * Shift LEDs forward and clear with zeros.
     */
    //% blockId="led_shift"
    //% block="shift LEDs"
    //% weight=10
    //% subcategory=LEDs
    //% deprecated=true
    export function ledShift(): void
    {
        neo().shift(1);
        updateLEDs()
    }

    /**
      * Convert from RGB values to colour number
      *
      * @param red Red value of the LED (0 to 255)
      * @param green Green value of the LED (0 to 255)
      * @param blue Blue value of the LED (0 to 255)
      */
    //% blockId="convertRGB"
    //% block="convert from red %red| green %green| blue %blue"
    //% weight=5
    //% subcategory=LEDs
    export function convertRGB(r: number, g: number, b: number): number
    {
        return ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);
    }

// Keypad Blocks

    /**
      * Get numeric value of key
      *
      * @param key name of key
      */
    //% blockId="e_keyValue"
    //% block=%keyName
    //% weight=50
    //% subcategory=Keypad
    export function eKeyValue(keyName: eKeys): number
    {
        return keyName;
    }

    /**
      * Wait for keypress
      *
      */
    //% blockId="e_waitForKey"
    //% block="get keypress"
    //% weight=100
    //% subcategory=Keypad
    export function eWaitKey(): number
    {
        let keypad = 0;
        let count = 0;
        while (keypad == 0) // retry if zero data - bit of a hack
        {
            pins.digitalWritePin(DigitalPin.P16, 1); // set clock High
            while (pins.digitalReadPin(DigitalPin.P15) == 1) // wait for SDO to go Low
            {
                count += 1;
                if (count > 1000)
                {
                    count = 0;
                    basic.pause(1)
                }
            }
            //while (pins.digitalReadPin(DigitalPin.P15) == 0) // wait for SDO to go High again
            //    ;
            //control.waitMicros(10);
            for (let index = 0; index <= 15; index++)
            {
                pins.digitalWritePin(DigitalPin.P16, 0) // set clock Low
                control.waitMicros(2)
                keypad = (keypad << 1) + pins.digitalReadPin(DigitalPin.P15) // read the data
                pins.digitalWritePin(DigitalPin.P16, 1) // set clock High again
                control.waitMicros(2)
            }
            keypad = 65535 - keypad
        }
        return keypad;
    }

}