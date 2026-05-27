#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_MCP4725.h>
#include <Adafruit_INA219.h>

// Create instances for our hardware chips
Adafruit_MCP4725 dac;
Adafruit_INA219 ina219;

// --- REGULATION DESIGN VALUES ---
const float TARGET_VOLTAGE = 12.0;      // The voltage we want the PSU to output
const float VOLTAGE_SCALE_FACTOR = 7.4; // Matches our 6.4k and 1k resistor divider

// --- CONTROL VARIABLE TRACKING ---
float error = 0.0;
float integral = 0.0;
float controlOutput = 0.0;

// Tuning coefficients for loop stability
const float Kp = 18.5;  
const float Ki = 3.0;   

unsigned long lastTime = 0;

void setup() {
    // Start serial data streaming for remote monitoring logs
    Serial.begin(115200);
    
    // Initialize I2C communication on the exact pins we used in KiCad
    Wire.begin(21, 22); 

    // Confirm the DAC chip is responding on the I2C bus
    if (!dac.begin(0x60)) { 
        Serial.println("[CRITICAL] MCP4725 DAC not detected! Check your KiCad layout lines.");
        while (1); 
    }
    
    // Confirm the Sensor chip is responding on the I2C bus
    if (!ina219.begin()) {
        Serial.println("[CRITICAL] INA219 Sensor not detected! Check your I2C connections.");
        while (1); 
    }

    ina219.setCalibration_32V_2A();
    dac.setVoltage(0, false); // Initialize system to 0V for baseline safety
    
    lastTime = millis();
    Serial.println("[STATUS] All peripherals online. Core tracking loop active.");
}

void loop() {
    unsigned long currentTime = millis();
    float dt = (currentTime - lastTime) / 1000.0; 

    // Execute exactly every 50ms (20Hz refresh interval)
    if (dt >= 0.05) {
        // 1. Read the actual output voltage from our feedback path
        float currentVoltage = ina219.getBusVoltage_V();
        
        // 2. Compute how far off we are from our 12V target
        error = TARGET_VOLTAGE - currentVoltage;
        
        // 3. Accumulate error over time (Integral factor)
        integral += error * dt;
        integral = constrain(integral, -40.0, 40.0); // Anti-windup safety limit

        // 4. Calculate final adjustment response
        controlOutput = (error * Kp) + (integral * Ki);
        
        // Convert to matching 12-bit binary steps (0 to 4095) for the DAC
        int32_t dacValue = (int32_t)controlOutput;
        dacValue = constrain(dacValue, 0, 4095); 

        // 5. Write command directly to the DAC hardware register
        dac.setVoltage(dacValue, false);

        // Print telemetry logs to the terminal
        Serial.printf("Target: %.2fV | Measured: %.2fV | System Error: %.3fV | DAC Command: %d\n",
                      TARGET_VOLTAGE, currentVoltage, error, dacValue);

        lastTime = currentTime;
    }
}