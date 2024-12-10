
namespace irCore
{
    let rxData: number[] = [0, 0, 0, 0]
    let rxIdx = 0
    let rxCount = 0
    let pulseCount = 0
    let width = 0
    let state = 0
    let lastCode = 0
    let _initEvents = true
    const irEvent = 1995

// Helper Functions

    function between(data: number, min: number, max: number): boolean
    {
        return (data >= min) && (data <= max)
    }

    function addBit(bit: number)
    {
        rxData[rxIdx] = (rxData[rxIdx] << 1) + bit
        rxCount++
        if (rxCount > 7)
        {
            rxCount = 0
            rxIdx++
        }
    }

    export function LastCode(): number
    {
	return lastCode
    }

// Main receiver function
    export function initEvents(irPin: DigitalPin): void
    {
        if (_initEvents)
        {
	    pins.setPull(irPin, PinPullMode.PullUp)
            pins.setEvents(irPin, PinEventType.Pulse);
            _initEvents = false;
	    pins.onPulsed(irPin, PulseValue.High, function ()
	    {
	        width = pins.pulseDuration()
	        if(state==0 && !between(width, 4000, 5000))	// ignore anything but start bit if not inside a packet
	            return
	        if(state==0 && between(width, 4000, 5000))	// start bit, so initialise data and counters
	        {
	            pulseCount = 0
	            for(let i=0; i<4; i++)
	                rxData[i] = 0
	            rxIdx = 0
	            rxCount = 0
	            state = 1
	            return
	        }
	        if(state==1 && between(width, 400, 700))	// a '0' bit
	            addBit(0)
	        if(state==1 && between(width, 1500, 1800))	// a '1' bit
	            addBit(1)
	        if (++pulseCount >= 32)	// 32 bits per packet, so we've done
	        {
	            state = 0
	            if(rxData[2] + rxData[3] == 255)
		        lastCode = rxData[2]
	            else
		        lastCode = 255		// flag an error
	            control.raiseEvent(irEvent, lastCode)
	        }
	    })
        }
    }
}
