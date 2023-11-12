/**
  * Enumeration of servos
  */
enum RVservos
{
    //% block="front left"
    FrontLeft=9,
    //% block="rear left"
    RearLeft=11,
    //% block="rear right"
    RearRight=13,
    //% block="front right"
    FrontRight=15,
    //% block="mast"
    Mast=0
}

/**
  * Enumeration of servo groups
  */
enum RVservoGroup
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
enum RVdirection
{
    //% block="left"
    Left,
    //% block="right"
    Right
}

/**
  * Enumeration of forward/reverse directions
  */
enum RVvector
{
    //% block="forward"
    Forward,
    //% block="reverse"
    Reverse
}

/**
 * Ping unit for sensor
 */
enum RVpingUnit
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
enum RVmotor
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
enum RVstopMode
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
enum RVupdateMode
{
    Manual,
    Auto
}

/**
  * Pre-Defined LED colours
  */
enum RVcolors
{
    Red=0,
    OliveGreen=1,
    BrightGreen=2,
    LightGreen=3,
    Green=4,
    BurntOrange=5,
    DarkBrown=6,
    Brown=7,
    Turquoise=8,
    BlueGreen=9,
    Orange=10,
    Maroon=11,
    Purple=12,
    Violet=13,
    LightBlue=14,
    Yellow=15,
    Indigo=16,
    MediumBlue=17,
    Blue=18,
    White=19,
    Pink=20,
    PaleGreen=21,
    PaleBlue=22,
    Grey=23,
    Black=24
}
    //% color.fieldOptions.colours='["#FF0000","#659900","#18E600","#80FF00","#00FF00","#FF8000","#D82600","#B24C00","#00FFC0","#00FF80","#FFC000","#FF0080","#FF00FF","#B09EFF","#00FFFF","#FFFF00","#8000FF","#0080FF","#0000FF","#FFFFFF","#FF8080","#80FF80","#40C0FF","#999999","#000000"]'

/**
  * Keypad keys
  */
enum RVkeys
{
    //% block="stop"
    Kstop=0b0000000010000000,
    //% block="forward"
    Kforward=0b0000010000000000,
    //% block="reverse"
    Kreverse=0b0000000000010000,
    //% block="forward left"
    KforwardLeft=0b0000001000000000,
    //% block="forward right"
    KforwardRight=0b0000100000000000,
    //% block="reverse left"
    KreverseLeft=0b0000000000001000,
    //% block="reverse right"
    KreverseRight=0b0000000000100000,
    //% block="spin left"
    KspinLeft=0b0000000001000000,
    //% block="spin right"
    KspinRight=0b0000000100000000,
    //% block="mast left"
    KmastLeft=0b1000000000000000,
    //% block="mast right"
    KmastRight=0b0100000000000000,
    //% block="cross"
    Kcross=0b0000000000000100,
    //% block="tick"
    Ktick=0b0000000000000010,
    //% block="pause"
    Kpause=0b0000000000000001,
    //% block="save"
    Ksave=0b0010000000000000,
    //% block="load"
    Kload=0b0001000000000000
}

/**
 * Blocks to operate 4tronix M.A.R.S. Rover
 */
//% weight=10 color=#e7660b icon="\uf135"
namespace marsRover
{
    let PCA = 0x40;	// i2c address of 4tronix Animoid servo controller
    let EEROM = 0x50;	// i2c address of EEROM
    let initI2C = false;
    let SERVOS = 0x06; // first servo address for start byte low
    let leftSpeed = 0;
    let rightSpeed = 0;
    let servoOffsets: number[] = [];
    let fireBand: fireled.Band;
    let _updateMode = RVupdateMode.Auto;


// HELPER FUNCTIONS

    function clamp(value: number, min: number, max: number): number
    {
        return Math.max(Math.min(max, value), min);
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
      * @param group which group of servos to centre
      */
    //% blockId="zeroServos"
    //% block="centre %group|servos"
    //% weight=100
    //% subcategory=Servos
    export function zeroServos(group: RVservoGroup): void
    {
        switch(group)
        {
            case RVservoGroup.Wheel:
                setServo(servoNumber(RVservos.FrontLeft), 0);
                setServo(servoNumber(RVservos.FrontRight), 0);
                setServo(servoNumber(RVservos.RearLeft), 0);
                setServo(servoNumber(RVservos.RearRight), 0);
                break;
            case RVservoGroup.Mast:
                setServo(servoNumber(RVservos.Mast), 0);
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
    //% blockId="steer"
    //% block="steer %direction|by angle%angle"
    //% weight=90
    //% subcategory=Servos
    export function steer(direction: RVdirection, angle: number): void
    { 
        angle = clamp(angle, 0, 90);
        if (direction==RVdirection.Left)
            angle = 0-angle;
        setServo(servoNumber(RVservos.FrontLeft), angle);
        setServo(servoNumber(RVservos.FrontRight), angle);
        setServo(servoNumber(RVservos.RearLeft), 0-angle);
        setServo(servoNumber(RVservos.RearRight), 0-angle);
    }

    /**
      * Set individual Servo Position by Angle
      * @param servo Servo number (0 to 15)
      * @param angle degrees to turn servo (-90 to +90)
      */
    //% blockId="setServo"
    //% block="set servo %servo=servoNumber|to angle%angle"
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
        angle = clamp(angle, -90, 90);
        let stop = 369 + (angle + servoOffsets[servo]) * 223 / 90;

        i2cData[0] = SERVOS + servo*4 + 2;	// Servo register
        i2cData[1] = (stop & 0xff);		// low byte stop
        pins.i2cWriteBuffer(PCA, i2cData, false);

        i2cData[0] = SERVOS + servo*4 + 3;	// Servo register
        i2cData[1] = (stop >> 8);		// high byte stop
        pins.i2cWriteBuffer(PCA, i2cData, false);
    }

    /**
      * Return servo number from name
      * @param value servo name
      */
    //% blockId="servoNumber"
    //% block="%value"
    //% weight=70
    //% subcategory=Servos
    export function servoNumber(value: RVservos): number
    {
        return value;
    }

    /**
      * Set Servo Offset. Does not save to EEROM
      * @param servo Servo number (0 to 15)
      * @param angle degrees to turn servo (-90 to +90)
      */
    //% blockId="setOffset"
    //% block="set offset of servo %servo=servoNumber| to %offset"
    //% weight=60
    //% subcategory=Servos
    export function setOffset(servo: number, offset: number): void
    {
        servo = clamp(servo, 0, 15);
        servoOffsets[servo] = offset;
    }

    /**
      * Get Servo Offset from memory. Does not load from EEROM
      * @param servo Servo number (0 to 15)
      */
    //% blockId="servoOffset"
    //% block="offset of servo %servo=servoNumber"
    //% weight=55
    //% subcategory=Servos
    export function servoOffset(servo: number): number
    {
        servo = clamp(servo, 0, 15);
        return servoOffsets[servo];
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
            servoOffsets[i] = 0;
    }

// MOTOR BLOCKS

    /**
      * Drive forward (or backward) at selected speed
      * @param direction select forwards or reverse
      * @param speed speed of motor between 0 and 100. eg: 60
      */
    //% blockId="move"
    //% block="move %direction| at speed %speed"
    //% speed.min=0 speed.max=100
    //% weight=100
    //% subcategory=Motors
    export function move(direction: RVvector, speed: number): void
    {
        speed = clamp(speed, 0, 100);
        motor(RVmotor.Both, direction, speed);
    }

    /**
      * Drive forward (or backward) at selected speed for milliseconds
      * @param direction select forwards or reverse
      * @param speed speed of motor between 0 and 100. eg: 60
      * @param millis duration in milliseconds to move, then stop. eg: 400
      */
    //% blockId="eMoveMilli"
    //% block="move %direction| at speed %speed| for %millis|(ms)"
    //% speed.min=0 speed.max=100
    //% weight=90
    //% subcategory=Motors
    export function moveMilli(direction: RVvector, speed: number, millis: number): void
    {
        speed = clamp(speed, 0, 100);
        motor(RVmotor.Both, direction, speed);
        basic.pause(millis);
        stop(RVstopMode.Coast);
    }

    /**
      * Stop rover by coasting slowly to a halt or braking
      * @param mode Brakes on or off
      */
    //% blockId="stop"
    //% block="stop with %mode"
    //% weight=80
    //% subcategory=Motors
    export function stop(mode: RVstopMode): void
    {
        let stopMode = (mode == RVstopMode.Brake) ? 1 :0;
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
    //% block="drive %motor|motors %direction|at speed %speed"
    //% weight=70
    //% speed.min=0 speed.max=100
    //% subcategory=Motors
    export function motor(motor: RVmotor, direction: RVvector, speed: number): void
    {
        speed = clamp(speed, 0, 100) * 10.23;
        let speed0 = 0;
        let speed1 = 0;
        setPWM(speed);
        if (direction == RVvector.Forward)
        {
            speed0 = speed;
            speed1 = 0;
        }
        else // must be Reverse
        {
            speed0 = 0;
            speed1 = speed;
        }
        if ((motor == RVmotor.Left) || (motor == RVmotor.Both))
        {
            pins.analogWritePin(AnalogPin.P1, speed0);
            pins.analogWritePin(AnalogPin.P12, speed1);
        }

        if ((motor == RVmotor.Right) || (motor == RVmotor.Both))
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
    //% blockId="spin"
    //% block="spin %direction| at speed %speed"
    //% weight=85
    //% subcategory=Motors
    export function spin(direction: RVdirection, speed: number): void
    { 
        speed = clamp(speed, 0, 100);
        setServo(servoNumber(RVservos.FrontLeft), 45);
        setServo(servoNumber(RVservos.FrontRight), -45);
        setServo(servoNumber(RVservos.RearLeft), -45);
        setServo(servoNumber(RVservos.RearRight), 45);
        if (direction==RVdirection.Left)
        {
            motor(RVmotor.Left, RVvector.Reverse, speed);
            motor(RVmotor.Right, RVvector.Forward, speed);
        }
        else
        {
            motor(RVmotor.Left, RVvector.Forward, speed);
            motor(RVmotor.Right, RVvector.Reverse, speed);
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
    export function readSonar(unit: RVpingUnit): number
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
            case RVpingUnit.Centimeters: return Math.round(d / 58);
            case RVpingUnit.Inches: return Math.round(d / 148);
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
    //% block="write %data|to address %address"
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
    //% block="load servo offsets from EEROM"
    //% weight=80
    //% subcategory=EEROM
    export function loadOffsets(): void
    {
	for (let i=0; i<16; i++)
            servoOffsets[i] = rdEEROM(i);
    }

    /**
      * Save servo offsets to EEROM
      */
    //% blockId="saveOffsets"
    //% block="save servo offsets to EEROM"
    //% weight=70
    //% subcategory=EEROM
    export function saveOffsets(): void
    {
	for (let i=0; i<16; i++)
            wrEEROM(servoOffsets[i],i);
    }


// FireLed Status Blocks

    // create a FireLed band if not got one already. Default to brightness 40
    function fire(): fireled.Band
    {
        if (!fireBand)
        {
            fireBand = fireled.newBand(DigitalPin.P2, 4);
            fireBand.setBrightness(40);
        }
        return fireBand;
    }

    // update FireLeds if _updateMode set to Auto
    function updateLEDs(): void
    {
        if (_updateMode == RVupdateMode.Auto)
            fire().updateBand();
    }

    /**
      * Sets all LEDs to a given color (range 0-255 for r, g, b).
      * @param rgb RGB color of the LED
      */
    //% blockId="setLedColor" block="set all LEDs to%rgb=colourSelect"
    //% weight=100
    //% subcategory=FireLeds
    //% blockGap=8
    export function setLedColor(rgb: number)
    {
        fire().setBand(rgb);
        updateLEDs();
    }

    /**
      * Clear all leds.
      */
    //% blockId="ledClear" block="clear all LEDs"
    //% weight=90
    //% subcategory=FireLeds
    //% blockGap=8
    export function ledClear(): void
    {
        fire().clearBand();
        updateLEDs();
    }

    /**
     * Set single LED to a given color (range 0-255 for r, g, b).
     *
     * @param ledId position of the LED (0 to 3)
     * @param rgb RGB color of the LED
     */
    //% blockId="setPixelColor" block="set LED at%ledId|to%rgb=colourSelect"
    //% weight=80
    //% subcategory=FireLeds
    //% blockGap=8
    export function setPixelColor(ledId: number, rgb: number): void
    {
        ledId = clamp(ledId, 0, 3);
        fire().setPixel(ledId, rgb);
        updateLEDs();
    }

    /**
     * Set the brightness of the LEDs
     * @param brightness a measure of LED brightness in 0-255. eg: 40
     */
    //% blockId="ledBrightness"
    //% block="set LED brightness%brightness"
    //% brightness.min=0 brightness.max=255
    //% weight=70
    //% subcategory=FireLeds
    //% blockGap=8
    export function ledBrightness(brightness: number): void
    {
        fire().setBrightness(brightness);
        updateLEDs();
    }

    /**
      * Shows a rainbow pattern on all LEDs.
      */
    //% blockId="ledRainbow"
    //% block="set LED rainbow"
    //% weight=60
    //% subcategory=FireLeds
    //% blockGap=8
    export function ledRainbow(): void
    {
        fire().setRainbow();
        updateLEDs()
    }

    /**
      * Get numeric value of colour
      * @param color Standard RGB Led Colours 
      */
    //% blockId="colourSelect"
    //% block=%color
    //% blockHidden=false
    //% weight=50
    //% subcategory=FireLeds
    //% blockGap=8
    //% shim=TD_ID colorSecondary="0xe7660b"
    //% color.fieldEditor="colornumber"
    //% color.fieldOptions.decompileLiterals=true
    //% color.defl='0xff0000'
    //% color.fieldOptions.colours='["#FF0000","#659900","#18E600","#80FF00","#00FF00","#FF8000","#D82600","#B24C00","#00FFC0","#00FF80","#FFC000","#FF0080","#FF00FF","#B09EFF","#00FFFF","#FFFF00","#8000FF","#0080FF","#0000FF","#FFFFFF","#FF8080","#80FF80","#40C0FF","#999999","#000000"]'
    //% color.fieldOptions.columns=5
    //% color.fieldOptions.className='rgbColorPicker'
    export function colourSelect(color: number): number
    {
        return color;
    }

    /**
      * Convert from RGB values to colour number
      *
      * @param red Red value of the LED (0 to 255)
      * @param green Green value of the LED (0 to 255)
      * @param blue Blue value of the LED (0 to 255)
      */
    //% blockId="convertRGB"
    //% block="convert from red %red|green %green|blue %blue"
    //% weight=40
    //% subcategory=FireLeds
    export function convertRGB(r: number, g: number, b: number): number
    {
        return ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);
    }

// Keypad Blocks

    /**
      * Get numeric value of key
      * @param key name of key
      */
    //% blockId="keyValue"
    //% block=%keyName
    //% weight=50
    //% subcategory=Keypad
    export function keyValue(keyName: RVkeys): number
    {
        return keyName;
    }

    /**
      * Wait for keypress
      *
      */
    //% blockId="waitForKey"
    //% block="get keypress"
    //% weight=100
    //% subcategory=Keypad
    export function waitForKey(): number
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
