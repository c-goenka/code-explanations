def convert_distance():
    print("\nDistance Conversion:")
    print("1. Miles to Kilometers")
    print("2. Kilometers to Miles")
    choice = input("Choose an option (1/2): ")

    if choice == '1':
        miles = float(input("Enter distance in miles: "))
        km = miles * 1.60934
        print(f"{miles} miles is equal to {km:.2f} kilometers.")
    elif choice == '2':
        km = float(input("Enter distance in kilometers: "))
        miles = km / 1.60934
        print(f"{km} kilometers is equal to {miles:.2f} miles.")
    else:
        print("Invalid choice!")


def convert_weight():
    print("\nWeight Conversion:")
    print("1. Pounds to Kilograms")
    print("2. Kilograms to Pounds")
    choice = input("Choose an option (1/2): ")

    if choice == '1':
        pounds = float(input("Enter weight in pounds: "))
        kg = pounds * 0.453592
        print(f"{pounds} pounds is equal to {kg:.2f} kilograms.")
    elif choice == '2':
        kg = float(input("Enter weight in kilograms: "))
        pounds = kg / 0.453592
        print(f"{kg} kilograms is equal to {pounds:.2f} pounds.")
    else:
        print("Invalid choice!")


def convert_temperature():
    print("\nTemperature Conversion:")
    print("1. Celsius to Fahrenheit")
    print("2. Fahrenheit to Celsius")
    choice = input("Choose an option (1/2): ")

    if choice == '1':
        celsius = float(input("Enter temperature in Celsius: "))
        fahrenheit = (celsius * 9/5) + 32
        print(f"{celsius}°C is equal to {fahrenheit:.2f}°F.")
    elif choice == '2':
        fahrenheit = float(input("Enter temperature in Fahrenheit: "))
        celsius = (fahrenheit - 32) * 5/9
        print(f"{fahrenheit}°F is equal to {celsius:.2f}°C.")
    else:
        print("Invalid choice!")


def main():
    print("Welcome to the Unit Converter!")
    while True:
        print("\nMain Menu:")
        print("1. Convert Distance")
        print("2. Convert Weight")
        print("3. Convert Temperature")
        print("4. Exit")
        choice = input("Choose an option (1/2/3/4): ")

        if choice == '1':
            convert_distance()
        elif choice == '2':
            convert_weight()
        elif choice == '3':
            convert_temperature()
        elif choice == '4':
            print("Thank you for using the Unit Converter. Goodbye!")
            break
        else:
            print("Invalid choice. Please try again.")


if __name__ == "__main__":
    main()
