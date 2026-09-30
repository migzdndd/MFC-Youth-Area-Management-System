using System.Windows;using MFCYouthAreaManagementSystem.Repositories;
namespace MFCYouthAreaManagementSystem.Views.Dialogs;
public partial class ChapterEditorWindow:Window
{
 private readonly long? _id;private readonly ChapterRepository _repo=new();
 public ChapterEditorWindow(long? id=null){InitializeComponent();_id=id;if(id.HasValue){var c=_repo.GetById(id.Value)??throw new InvalidOperationException("Chapter not found.");NameBox.Text=c.ChapterName;Heading.Text="Rename Chapter";Title=Heading.Text;}else{Heading.Text="Add Chapter";Title=Heading.Text;}}
 private void Save_Click(object s,RoutedEventArgs e){try{var name=NameBox.Text.Trim();if(string.IsNullOrWhiteSpace(name))throw new InvalidOperationException("Chapter Name is required.");if(_id.HasValue)_repo.Rename(_id.Value,name);else _repo.Add(name);DialogResult=true;}catch(Exception ex){MessageBox.Show(this,ex.Message,"Unable to save chapter",MessageBoxButton.OK,MessageBoxImage.Warning);}}
 private void Cancel_Click(object s,RoutedEventArgs e)=>DialogResult=false;
}
