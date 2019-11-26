{
// MOTORS

  // Move forward
  Rover.move(eVector.Forward, 60)
  basic.pause(1000);

  // Reverse for 2s
  Rover.move_milli(eVector.Reverse, 70, 2000)

  // Spin Left
  Rover.spin(eDirection.Left, 60)
  basic.pause(1000);

  // Stop with Brake
  Rover.stop(eStopMode.Coast)
  basic.pause(1000);

// SERVOS

  // Centre all servos
  Rover.zeroServos(eServoGroup.All)
  basic.pause(1000);

  // Steer Left
  Rover.steer(eDirection.Left, 30)
  basic.pause(1000);

  // Turn mast head to right
  Rover.setServo(Rover.getServoNumber(eServos.Mast), 30)
  basic.pause(1000);

// SENSORS

  // Display sonar values
  basic.showNumber(Rover.readSonar(ePingUnit.Centimeters))
  basic.pause(1000);

// LEDS
  // Set all LEDs to Red
  Rover.setLedColor(Rover.eColours(eColors.Red))
  basic.pause(1000);

  // Clear all LEDs
  Rover.ledClear()
  basic.pause(1000);

  // Set LED at position 2 to Green
  Rover.setPixelColor(2, Rover.eColours(eColors.Green))
  basic.pause(1000);

  // Set LEDs to a rainbow selection
  Rover.ledRainbow()
  basic.pause(1000);

  // Set brightness of LEDs to 100
  Rover.ledBrightness(100)
  basic.pause(1000);
 
}
