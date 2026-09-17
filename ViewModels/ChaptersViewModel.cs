using System.Collections.ObjectModel;using System.Windows;using System.Windows.Input;using MFCYouthAreaManagementSystem.Models;using MFCYouthAreaManagementSystem.Repositories;using MFCYouthAreaManagementSystem.ViewModels.Base;using MFCYouthAreaManagementSystem.Views.Dialogs;
namespace MFCYouthAreaManagementSystem.ViewModels;
public sealed class ChaptersViewModel:ObservableObject
{
 private readonly ChapterRepository _repo=new();public ObservableCollection<Chapter> Chapters{get;}=new();private string _search="";public string SearchText{get=>_search;set{if(SetProperty(ref _search,value))Load();}}private Chapter? _selected;public Chapter? SelectedChapter{get=>_selected;set{if(SetProperty(ref _selected,value))CommandManager.InvalidateRequerySuggested();}}
 public ICommand AddCommand{get;}public ICommand RenameCommand{get;}public ICommand ManageCommand{get;}public ICommand DeleteCommand{get;}public ICommand RefreshCommand{get;}
 public ChaptersViewModel(){AddCommand=new RelayCommand(Add);RenameCommand=new RelayCommand(Rename,Has);ManageCommand=new RelayCommand(Manage,Has);DeleteCommand=new RelayCommand(Delete,Has);RefreshCommand=new RelayCommand(Load);Load();}private bool Has()=>SelectedChapter!=null;private Window? Owner=>Application.Current?.MainWindow;
 public void Load(){try{var rows=_repo.GetAll(SearchText??"");Chapters.Clear();foreach(var x in rows)Chapters.Add(x);}catch(Exception ex){MessageBox.Show(Owner,ex.Message,"Unable to load chapters",MessageBoxButton.OK,MessageBoxImage.Warning);}}
 private void Add(){if(new ChapterEditorWindow{Owner=Owner}.ShowDialog()==true)Load();}private void Rename(){if(SelectedChapter==null)return;if(new ChapterEditorWindow(SelectedChapter.ChapterID){Owner=Owner}.ShowDialog()==true)Load();}
 private void Manage(){if(SelectedChapter==null)return;var d=new ChapterMembersWindow(SelectedChapter.ChapterID,SelectedChapter.ChapterName){Owner=Owner};d.ShowDialog();if(d.Changed)Load();}
 private void Delete(){if(SelectedChapter==null)return;if(MessageBox.Show(Owner,$"Delete chapter '{SelectedChapter.ChapterName}'? Assigned members must be moved first.","Confirm delete",MessageBoxButton.YesNo,MessageBoxImage.Warning)!=MessageBoxResult.Yes)return;try{_repo.Delete(SelectedChapter.ChapterID);Load();}catch(Exception ex){MessageBox.Show(Owner,ex.Message,"Unable to delete chapter",MessageBoxButton.OK,MessageBoxImage.Warning);}}
}
