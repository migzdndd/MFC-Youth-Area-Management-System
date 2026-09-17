using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.Repositories;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Views.Dialogs;

public partial class GigTrackerWindow : Window
{
    private readonly long _memberId;
    private readonly GIGContributionRepository _repo = new();

    public GigTrackerWindow(long memberId, string memberName)
    {
        InitializeComponent();
        _memberId = memberId;
        MemberText.Text = memberName;
        Reload();
    }

    private void Reload()
    {
        Grid.ItemsSource = _repo.GetByMember(_memberId);
        TotalText.Text = $"₱{_repo.GetTotalForMember(_memberId):N2}";
    }

    private GIGContribution? Selected => Grid.SelectedItem as GIGContribution;

    private void Add_Click(object s, RoutedEventArgs e)
    {
        var dlg = new GigEditorWindow(_memberId) { Owner = this };
        if (dlg.ShowDialog() == true) Reload();
    }

    private void Edit_Click(object s, RoutedEventArgs e)
    {
        if (Selected is null)
        {
            Warn();
            return;
        }
        var dlg = new GigEditorWindow(_memberId, Selected) { Owner = this };
        if (dlg.ShowDialog() == true) Reload();
    }

    private void Delete_Click(object s, RoutedEventArgs e)
    {
        if (Selected is null)
        {
            Warn();
            return;
        }
        if (MessageBox.Show(this, "Delete the selected contribution? This cannot be undone.", "Confirm delete",
                MessageBoxButton.YesNo, MessageBoxImage.Warning) != MessageBoxResult.Yes)
            return;

        try
        {
            _repo.Delete(Selected.ContributionID, _memberId);
            Reload();
        }
        catch (Exception ex)
        {
            MessageBox.Show(this, ex.Message, "Unable to delete", MessageBoxButton.OK, MessageBoxImage.Warning);
        }
    }

    private void Warn() =>
        MessageBox.Show(this, "Select a contribution from the list first.", "GIG Tracker", MessageBoxButton.OK, MessageBoxImage.Information);

    private void Close_Click(object s, RoutedEventArgs e) => Close();
}

public sealed class GigEditorWindow : Window
{
    private readonly long _memberId;
    private readonly GIGContribution? _existing;
    private readonly DatePicker _date = new() { SelectedDate = DateTime.Today };
    private readonly TextBox _amount = new();
    private readonly TextBox _remarks = new() { AcceptsReturn = true, Height = 75, TextWrapping = TextWrapping.Wrap };

    public GigEditorWindow(long memberId, GIGContribution? existing = null)
    {
        _memberId = memberId;
        _existing = existing;
        Title = existing is null ? "Add GIG Contribution" : "Edit GIG Contribution";
        Width = 460;
        Height = 440;
        MinWidth = 400;
        MinHeight = 400;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;

        if (Application.Current?.Resources["PageBackground"] is Brush pageBg)
            Background = pageBg;

        var rootGrid = new Grid();
        rootGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
        rootGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });
        rootGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });

        // Header
        var header = new Border
        {
            Padding = new Thickness(20, 16, 20, 16),
            BorderThickness = new Thickness(0, 0, 0, 1),
            BorderBrush = Application.Current?.Resources["BorderBrushApp"] as Brush ?? Brushes.LightGray,
            Background = Application.Current?.Resources["SurfaceSubtle"] as Brush ?? Brushes.WhiteSmoke
        };
        var headerStack = new StackPanel();
        var titleText = new TextBlock
        {
            Text = Title,
            FontSize = 18,
            FontWeight = FontWeights.Bold,
            Foreground = Application.Current?.Resources["Navy"] as Brush ?? Brushes.Navy
        };
        headerStack.Children.Add(titleText);
        header.Child = headerStack;
        Grid.SetRow(header, 0);
        rootGrid.Children.Add(header);

        // Body Form
        var scroll = new ScrollViewer { VerticalScrollBarVisibility = ScrollBarVisibility.Auto };
        var formCard = new Border
        {
            Margin = new Thickness(20, 16, 20, 16),
            Padding = new Thickness(16),
            CornerRadius = new CornerRadius(8),
            Background = Application.Current?.Resources["Surface"] as Brush ?? Brushes.White,
            BorderBrush = Application.Current?.Resources["BorderBrushApp"] as Brush ?? Brushes.LightGray,
            BorderThickness = new Thickness(1)
        };
        var panel = new StackPanel();

        var dateLabel = new TextBlock { Text = "Contribution Date *", FontWeight = FontWeights.SemiBold, FontSize = 12, Margin = new Thickness(0, 0, 0, 4) };
        panel.Children.Add(dateLabel);
        panel.Children.Add(_date);

        var amountLabel = new TextBlock { Text = "Amount (PHP) *", FontWeight = FontWeights.SemiBold, FontSize = 12, Margin = new Thickness(0, 10, 0, 4) };
        panel.Children.Add(amountLabel);
        panel.Children.Add(_amount);

        var remarksLabel = new TextBlock { Text = "Remarks / Purpose", FontWeight = FontWeights.SemiBold, FontSize = 12, Margin = new Thickness(0, 10, 0, 4) };
        panel.Children.Add(remarksLabel);
        panel.Children.Add(_remarks);

        formCard.Child = panel;
        scroll.Content = formCard;
        Grid.SetRow(scroll, 1);
        rootGrid.Children.Add(scroll);

        // Footer Actions
        var footer = new Border
        {
            Padding = new Thickness(16, 12, 16, 12),
            BorderThickness = new Thickness(0, 1, 0, 0),
            BorderBrush = Application.Current?.Resources["BorderBrushApp"] as Brush ?? Brushes.LightGray,
            Background = Application.Current?.Resources["SurfaceSubtle"] as Brush ?? Brushes.WhiteSmoke
        };
        var actions = new StackPanel { Orientation = Orientation.Horizontal, HorizontalAlignment = HorizontalAlignment.Right };

        var cancel = new Button { Content = "Cancel", Margin = new Thickness(0, 0, 8, 0) };
        if (Application.Current?.Resources["SecondaryButton"] is Style secStyle) cancel.Style = secStyle;
        cancel.Click += (_, _) => DialogResult = false;

        var save = new Button { Content = "Save Contribution" };
        if (Application.Current?.Resources["PrimaryButton"] is Style priStyle) save.Style = priStyle;
        save.Click += Save;

        actions.Children.Add(cancel);
        actions.Children.Add(save);
        footer.Child = actions;
        Grid.SetRow(footer, 2);
        rootGrid.Children.Add(footer);

        Content = rootGrid;

        if (existing != null)
        {
            _date.SelectedDate = existing.ContributionDate;
            _amount.Text = existing.Amount.ToString("0.00");
            _remarks.Text = existing.Remarks ?? "";
        }
    }

    private void Save(object? s, RoutedEventArgs e)
    {
        try
        {
            if (!_date.SelectedDate.HasValue)
                throw new InvalidOperationException("Contribution Date is required.");
            if (_date.SelectedDate.Value.Date > DateTime.Today)
                throw new InvalidOperationException("Contribution Date cannot be in the future.");
            if (!ValidationHelper.TryParsePositiveAmount(_amount.Text, out var amount))
                throw new InvalidOperationException("Amount must be a valid number greater than zero.");

            var item = new GIGContribution
            {
                ContributionID = _existing?.ContributionID ?? 0,
                MemberID = _memberId,
                ContributionDate = _date.SelectedDate.Value.Date,
                Amount = amount,
                Remarks = string.IsNullOrWhiteSpace(_remarks.Text) ? null : _remarks.Text.Trim()
            };

            var repo = new GIGContributionRepository();
            if (_existing is null) repo.Add(item);
            else repo.Update(item);

            DialogResult = true;
        }
        catch (Exception ex)
        {
            MessageBox.Show(this, ex.Message, "Unable to save", MessageBoxButton.OK, MessageBoxImage.Warning);
        }
    }
}
