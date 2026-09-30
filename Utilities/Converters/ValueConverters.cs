using System.Collections;
using System.Globalization;
using System.Windows;
using System.Windows.Data;
using System.Windows.Media;

namespace MFCYouthAreaManagementSystem.Utilities.Converters;

/// <summary>
/// Converts a boolean to Visibility (Visible if true, Collapsed if false).
/// </summary>
public sealed class BooleanToVisibilityConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        return value is true ? Visibility.Visible : Visibility.Collapsed;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        return value is Visibility.Visible;
    }
}

/// <summary>
/// Converts a boolean to Visibility inversely (Collapsed if true, Visible if false).
/// </summary>
public sealed class InverseBooleanToVisibilityConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        return value is true ? Visibility.Collapsed : Visibility.Visible;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        return value is not Visibility.Visible;
    }
}

/// <summary>
/// Converts an empty collection to Visible, and non-empty to Collapsed (for empty-state overlays).
/// </summary>
public sealed class EmptyCollectionToVisibilityConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value == null) return Visibility.Visible;
        if (value is int count) return count == 0 ? Visibility.Visible : Visibility.Collapsed;
        if (value is ICollection col) return col.Count == 0 ? Visibility.Visible : Visibility.Collapsed;
        if (value is IEnumerable enumerable)
        {
            var enumerator = enumerable.GetEnumerator();
            return !enumerator.MoveNext() ? Visibility.Visible : Visibility.Collapsed;
        }
        return Visibility.Collapsed;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}

/// <summary>
/// Converts a non-empty collection to Visible, and empty to Collapsed.
/// </summary>
public sealed class HasItemsToVisibilityConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value == null) return Visibility.Collapsed;
        if (value is int count) return count > 0 ? Visibility.Visible : Visibility.Collapsed;
        if (value is ICollection col) return col.Count > 0 ? Visibility.Visible : Visibility.Collapsed;
        if (value is IEnumerable enumerable)
        {
            var enumerator = enumerable.GetEnumerator();
            return enumerator.MoveNext() ? Visibility.Visible : Visibility.Collapsed;
        }
        return Visibility.Collapsed;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}

/// <summary>
/// Converts member/payment status string to appropriate badge foreground color brush.
/// </summary>
public sealed class StatusToForegroundConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        var text = value?.ToString()?.Trim() ?? string.Empty;
        if (string.Equals(text, "Active", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(text, "Paid", StringComparison.OrdinalIgnoreCase))
        {
            return new SolidColorBrush(Color.FromRgb(22, 163, 74)); // Green
        }
        if (string.Equals(text, "Inactive", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(text, "Unpaid", StringComparison.OrdinalIgnoreCase))
        {
            return new SolidColorBrush(Color.FromRgb(220, 38, 38)); // Red
        }
        return new SolidColorBrush(Color.FromRgb(101, 112, 128)); // Muted
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}

/// <summary>
/// Converts member/payment status string to appropriate badge background color brush.
/// </summary>
public sealed class StatusToBackgroundConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        var text = value?.ToString()?.Trim() ?? string.Empty;
        if (string.Equals(text, "Active", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(text, "Paid", StringComparison.OrdinalIgnoreCase))
        {
            return new SolidColorBrush(Color.FromRgb(240, 253, 244)); // Light green
        }
        if (string.Equals(text, "Inactive", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(text, "Unpaid", StringComparison.OrdinalIgnoreCase))
        {
            return new SolidColorBrush(Color.FromRgb(254, 242, 242)); // Light red
        }
        return new SolidColorBrush(Color.FromRgb(241, 245, 249)); // Light gray
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}

/// <summary>
/// Converts member/payment status string to appropriate badge border color brush.
/// </summary>
public sealed class StatusToBorderConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        var text = value?.ToString()?.Trim() ?? string.Empty;
        if (string.Equals(text, "Active", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(text, "Paid", StringComparison.OrdinalIgnoreCase))
        {
            return new SolidColorBrush(Color.FromRgb(187, 247, 208)); // Green border
        }
        if (string.Equals(text, "Inactive", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(text, "Unpaid", StringComparison.OrdinalIgnoreCase))
        {
            return new SolidColorBrush(Color.FromRgb(254, 202, 202)); // Red border
        }
        return new SolidColorBrush(Color.FromRgb(203, 213, 225)); // Gray border
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}
