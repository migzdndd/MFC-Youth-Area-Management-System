using System.Windows;

namespace MFCYouthAreaManagementSystem.Views;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        DataContext = new MFCYouthAreaManagementSystem.ViewModels.MainWindowViewModel();
    }
}
