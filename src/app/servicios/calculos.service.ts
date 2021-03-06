import { Injectable } from '@angular/core';
import { SesionService, PeticionesAPIService} from './index';
import { Grupo, Equipo, Juego, Alumno, Nivel, TablaAlumnoJuegoDePuntos, TablaHistorialPuntosAlumno, AlumnoJuegoDePuntos,
         TablaEquipoJuegoDePuntos, HistorialPuntosAlumno, HistorialPuntosEquipo, EquipoJuegoDePuntos, TablaHistorialPuntosEquipo,
         AlumnoJuegoDeColeccion, Album, EquipoJuegoDeColeccion, AlbumEquipo, Cromo, TablaJornadas, TablaAlumnoJuegoDeCompeticion,
         TablaEquipoJuegoDeCompeticion, Jornada, EquipoJuegoDeCompeticionLiga, EnfrentamientoLiga, InformacionPartidosLiga,
         AlumnoJuegoDeCompeticionLiga, AlumnoJuegoDeCompeticionFormulaUno, EquipoJuegoDeCompeticionFormulaUno,
         TablaClasificacionJornada, TablaPuntosFormulaUno} from '../clases/index';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { analyzeAndValidateNgModules } from '@angular/compiler';
import { calcPossibleSecurityContexts } from '@angular/compiler/src/template_parser/binding_parser';

import Swal from 'sweetalert2';


@Injectable({
  providedIn: 'root'
})
export class CalculosService {

  juegosDePuntosActivos: Juego[] = [];
  juegosDePuntosInactivos: Juego[] = [];
  juegosDeColeccionActivos: Juego[] = [];
  juegosDeColeccionInactivos: Juego[] = [];
  juegosDeCompeticionActivos: Juego[] = [];
  juegosDeCompeticionInactivos: Juego[] = [];
  todosLosJuegosActivos: Juego[] = [];
  todosLosJuegosInactivos: Juego[] = [];
  ListaJuegosSeleccionadoActivo: Juego[];
  ListaJuegosSeleccionadoInactivo: Juego[];
  rondas: Array<Array<EnfrentamientoLiga>>;
  informacionPartidos: InformacionPartidosLiga[];
  jornadasnuevas: Jornada[];
  TablaeditarPuntos: TablaPuntosFormulaUno[];
  AlumnoJuegoDeCompeticionLigaId: number;
  EquipoJuegoDeCompeticionLigaId: number;
  empateAsignado = 0;

  constructor(
    private sesion: SesionService,
    private peticionesAPI: PeticionesAPIService
   ) {}


  // Elimina el grupo (tanto el id del profe como del grupo estan en sesión.
  // Lo hago con un observable para que el componente que muestra la lista de grupos
  // espere hasta que se haya acabado la operacion de borrar el grupo de la base de datos
  public EliminarGrupo(): any {
    const eliminaObservable = new Observable ( obs => {


          this.peticionesAPI.BorraGrupo(
                    this.sesion.DameProfesor().id,
                    this.sesion.DameGrupo().id)
          .subscribe(() => {

            this.EliminarMatriculas();

            // Ahora elimino el grupo de la lista de grupos para que desaparezca de la pantalla al regresar
            let lista = this.sesion.DameListaGrupos();
            lista = lista.filter (g => g.id !== this.sesion.DameGrupo().id);
            obs.next ();
          });
    });
    return eliminaObservable;
  }

  // ESTA FUNCIÓN RECUPERA TODAS LAS MATRICULAS DEL GRUPO QUE VAMOS A BORRAR Y DESPUÉS LAS BORRA. ESTO LO HACEMOS PARA NO
  // DEJAR MATRICULAS QUE NO NOS SIRVEN EN LA BASE DE DATOS
  private EliminarMatriculas() {
    // Pido las matrículas correspondientes al grupo que voy a borrar
    this.peticionesAPI.DameMatriculasGrupo(this.sesion.DameGrupo().id)
    .subscribe( matriculas => {
      if (matriculas[0] !== undefined) {

        // Una vez recibo las matriculas del grupo, las voy borrando una a una
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < matriculas.length; i++) {
          this.peticionesAPI.BorraMatricula(matriculas[i].id)
          .subscribe(() => {
              console.log('matricula borrada correctamente');
          });
        }
      } else {
        console.log('no hay matriculas');
      }

    });
  }


  // Trae de la base de datos todos los juegos del grupo y los organiza en dos
  // listas, una de activos y otra de inactivos. Retorna estas listas como observable

  public DameListaJuegos(grupoID: number): any {
    const listasObservables = new Observable ( obs => {

      const juegosActivos: Juego[] = [];
      const juegosInactivos: Juego[] = [];

      console.log ('vamos a por los juegos de puntos del grupo: ' + grupoID);
      this.peticionesAPI.DameJuegoDePuntosGrupo(grupoID)
      .subscribe(juegosPuntos => {
        console.log('He recibido los juegos de puntos');
        console.log(juegosPuntos);
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < juegosPuntos.length; i++) {
          if (juegosPuntos[i].JuegoActivo === true) {
            juegosActivos.push(juegosPuntos[i]);
          } else {
            console.log('Juego inactivo');
            console.log(juegosPuntos[i]);
            juegosInactivos.push(juegosPuntos[i]);
          }
        }
        // Ahora vamos apor por los juegos de colección
        console.log ('vamos a por los juegos de colección del grupo: ' + grupoID);
        this.peticionesAPI.DameJuegoDeColeccionGrupo(grupoID)
        .subscribe(juegosColeccion => {
          console.log('He recibido los juegos de coleccion');
          console.log(juegosColeccion);
          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < juegosColeccion.length; i++) {
            if (juegosColeccion[i].JuegoActivo === true) {
              juegosActivos.push(juegosColeccion[i]);
            } else {
              juegosInactivos.push(juegosColeccion[i]);
            }
          }
          // Ahora vamos a por los juegos de competición
          console.log ('vamos a por los juegos de competicion liga del grupo: ' + grupoID);
          this.peticionesAPI.DameJuegoDeCompeticionLigaGrupo(grupoID)
          .subscribe(juegosCompeticion => {
            console.log('He recibido los juegos de competición');
            console.log(juegosCompeticion);
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < juegosCompeticion.length; i++) {
              if (juegosCompeticion[i].JuegoActivo === true) {
                juegosActivos.push(juegosCompeticion[i]);
              } else {
                juegosInactivos.push(juegosCompeticion[i]);
              }
            }
            console.log ('vamos a por los juegos de competicion formula uno del grupo: ' + grupoID);
            this.peticionesAPI.DameJuegoDeCompeticionFormulaUnoGrupo(grupoID)
            .subscribe(juegosCompeticionFormulaUno => {
            console.log('He recibido los juegos de competición formula uno');
            console.log(juegosCompeticionFormulaUno);
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < juegosCompeticionFormulaUno.length; i++) {
              if (juegosCompeticionFormulaUno[i].JuegoActivo === true) {
                juegosActivos.push(juegosCompeticionFormulaUno[i]);
              } else {
                juegosInactivos.push(juegosCompeticionFormulaUno[i]);
              }
            }
            const resultado = { activos: juegosActivos, inactivos: juegosInactivos};
            obs.next (resultado);
            // this.PreparaListas ();
            });
          });
        });
      });
    });

    return listasObservables;
  }

  public PrepararTablaRankingIndividual(  listaAlumnosOrdenadaPorPuntos,
                                          alumnosDelJuego,
                                          nivelesDelJuego): any {

      const rankingJuegoDePuntos: any [] = [];
      // tslint:disable-next-line:prefer-for-of
      for (let i = 0; i < listaAlumnosOrdenadaPorPuntos.length; i++) {
        let alumno: Alumno;
        let nivel: Nivel;
        const alumnoId = listaAlumnosOrdenadaPorPuntos[i].alumnoId;
        const nivelId = listaAlumnosOrdenadaPorPuntos[i].nivelId;
        alumno = alumnosDelJuego.filter(res => res.id === alumnoId)[0];

        if (listaAlumnosOrdenadaPorPuntos[i].nivelId !== undefined) {
          nivel = nivelesDelJuego.filter(res => res.id === nivelId)[0];
        }

        if (nivel !== undefined) {
          rankingJuegoDePuntos[i] = new TablaAlumnoJuegoDePuntos (i + 1, alumno.Nombre, alumno.PrimerApellido, alumno.SegundoApellido,
            listaAlumnosOrdenadaPorPuntos[i].PuntosTotalesAlumno, nivel.Nombre);

        } else {
          rankingJuegoDePuntos[i] = new TablaAlumnoJuegoDePuntos (i + 1, alumno.Nombre, alumno.PrimerApellido, alumno.SegundoApellido,
            listaAlumnosOrdenadaPorPuntos[i].PuntosTotalesAlumno);
        }
      }

      return (rankingJuegoDePuntos);

  }

  //////////////////////////////////////////       JUEGO DE COMPETICIÓN  LIGA    ////////////////////////////////////////
  public PrepararTablaRankingIndividualLiga(listaAlumnosOrdenadaPorPuntos: AlumnoJuegoDeCompeticionLiga[],
                                            alumnosDelJuego: Alumno[], jornadasDelJuego: Jornada[],
                                            enfrentamientosDelJuego: EnfrentamientoLiga[][] ): TablaAlumnoJuegoDeCompeticion[] {
    const rankingJuegoDeCompeticion: TablaAlumnoJuegoDeCompeticion [] = [];
    console.log (' Vamos a preparar la tabla del ranking individual de Competición Liga');
    console.log ('la lista de alumnos ordenada es: ');
    console.log (listaAlumnosOrdenadaPorPuntos);
    // tslint:disable-next-line:prefer-for-oF
    for (let i = 0; i < listaAlumnosOrdenadaPorPuntos.length; i++) {
      let alumno: Alumno;
      const alumnoId = listaAlumnosOrdenadaPorPuntos[i].AlumnoId;
      alumno = alumnosDelJuego.filter(res => res.id === alumnoId)[0];
      rankingJuegoDeCompeticion[i] = new TablaAlumnoJuegoDeCompeticion(i + 1, alumno.Nombre, alumno.PrimerApellido, alumno.SegundoApellido,
                                                                       listaAlumnosOrdenadaPorPuntos[i].PuntosTotalesAlumno, alumnoId);
    }
    const individual = true;
    const informacionPartidos = this.ObtenerInformaciónPartidos(listaAlumnosOrdenadaPorPuntos, jornadasDelJuego,
                                                                individual, enfrentamientosDelJuego);
    console.log('Vamos a rellenar la TablaEquipoJuegoDeCompeticion con la informacionPartidos');
    const rankingJuegoDeCompeticionFinal = this.RellenarTablaAlumnoJuegoDeCompeticion(rankingJuegoDeCompeticion, informacionPartidos);
    console.log ('El ranking es: ' );
    console.log (rankingJuegoDeCompeticionFinal);
    return rankingJuegoDeCompeticionFinal;
  }

  public PrepararTablaRankingEquipoLiga( listaEquiposOrdenadaPorPuntos: EquipoJuegoDeCompeticionLiga[],
                                         equiposDelJuego: Equipo[], jornadasDelJuego: Jornada[],
                                         enfrentamientosDelJuego: EnfrentamientoLiga[][] ): TablaEquipoJuegoDeCompeticion[] {
    const rankingJuegoDeCompeticion: TablaEquipoJuegoDeCompeticion [] = [];
    console.log (' Vamos a preparar la tabla del ranking por equipos de Competición Liga');
    console.log ('la lista de equipos ordenada es: ');
    console.log (listaEquiposOrdenadaPorPuntos);
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < listaEquiposOrdenadaPorPuntos.length; i++) {
      let equipo: Equipo;
      const EquipoId = listaEquiposOrdenadaPorPuntos[i].EquipoId;
      equipo = equiposDelJuego.filter(res => res.id === EquipoId)[0];
      rankingJuegoDeCompeticion[i] = new TablaEquipoJuegoDeCompeticion(i + 1, equipo.Nombre,
                                                                       listaEquiposOrdenadaPorPuntos[i].PuntosTotalesEquipo, EquipoId);
    }
    const individual = false;
    const informacionPartidos = this.ObtenerInformaciónPartidos(listaEquiposOrdenadaPorPuntos, jornadasDelJuego,
                                                                individual, enfrentamientosDelJuego);
    console.log('Vamos a rellenar la TablaEquipoJuegoDeCompeticion con la informacionPartidos');
    const rankingJuegoDeCompeticionFinal = this.RellenarTablaEquipoJuegoDeCompeticion(rankingJuegoDeCompeticion, informacionPartidos);
    console.log ('El ranking es: ' );
    console.log (rankingJuegoDeCompeticionFinal);
    return rankingJuegoDeCompeticionFinal;
  }

  public  ConstruirTablaEnfrentamientos(EnfrentamientosJornadaSeleccionada: EnfrentamientoLiga[],
                                        listaAlumnosClasificacion: TablaAlumnoJuegoDeCompeticion[],
                                        listaEquiposClasificacion: TablaEquipoJuegoDeCompeticion[],
                                        juegoSeleccionado: Juego) {
    console.log ('Aquí tendré la tabla de enfrentamientos, los enfrentamientos sonc:');
    console.log(EnfrentamientosJornadaSeleccionada);
    console.log('Distinción entre Individual y equipos');
    if (juegoSeleccionado.Modo === 'Individual') {
      // tslint:disable-next-line:prefer-for-of
      for (let i = 0; i < EnfrentamientosJornadaSeleccionada.length; i++) {
        // tslint:disable-next-line:prefer-for-of
        for (let j = 0; j < listaAlumnosClasificacion.length; j++) {
          if (EnfrentamientosJornadaSeleccionada[i].JugadorUno === listaAlumnosClasificacion[j].id) {
              EnfrentamientosJornadaSeleccionada[i].nombreJugadorUno = listaAlumnosClasificacion[j].nombre + ' ' +
                                                                       listaAlumnosClasificacion[j].primerApellido + ' ' +
                                                                       listaAlumnosClasificacion[j].segundoApellido;
              if (EnfrentamientosJornadaSeleccionada[i].Ganador === listaAlumnosClasificacion[j].id) {
                EnfrentamientosJornadaSeleccionada[i].nombreGanador = listaAlumnosClasificacion[j].nombre + ' ' +
                                                                      listaAlumnosClasificacion[j].primerApellido + ' ' +
                                                                      listaAlumnosClasificacion[j].segundoApellido;
            } else if (EnfrentamientosJornadaSeleccionada[i].Ganador === 0) {
               EnfrentamientosJornadaSeleccionada[i].nombreGanador = 'Empate';
            } else if (EnfrentamientosJornadaSeleccionada[i].Ganador === undefined) {
               EnfrentamientosJornadaSeleccionada[i].nombreGanador = '-';
            }
          } else if (EnfrentamientosJornadaSeleccionada[i].JugadorDos === listaAlumnosClasificacion[j].id) {
              EnfrentamientosJornadaSeleccionada[i].nombreJugadorDos = listaAlumnosClasificacion[j].nombre + ' ' +
                                                                       listaAlumnosClasificacion[j].primerApellido + ' ' +
                                                                       listaAlumnosClasificacion[j].segundoApellido;
              if (EnfrentamientosJornadaSeleccionada[i].Ganador === listaAlumnosClasificacion[j].id) {
                EnfrentamientosJornadaSeleccionada[i].nombreGanador = listaAlumnosClasificacion[j].nombre + ' ' +
                                                                      listaAlumnosClasificacion[j].primerApellido + ' ' +
                                                                      listaAlumnosClasificacion[j].segundoApellido;
              } else if (EnfrentamientosJornadaSeleccionada[i].Ganador === 0) {
                         EnfrentamientosJornadaSeleccionada[i].nombreGanador = 'Empate';
              } else if (EnfrentamientosJornadaSeleccionada[i].Ganador === undefined) {
                  EnfrentamientosJornadaSeleccionada[i].nombreGanador = '-';
              }
          }
        }
      }

    } else {
      console.log('Estoy en ConstruirTablaEnfrentamientos() equipos');
      // tslint:disable-next-line:prefer-for-of
      for (let i = 0; i < EnfrentamientosJornadaSeleccionada.length; i++) {
        // tslint:disable-next-line:prefer-for-of
        for (let j = 0; j < listaEquiposClasificacion.length; j++) {
          if (EnfrentamientosJornadaSeleccionada[i].JugadorUno === listaEquiposClasificacion[j].id) {
            EnfrentamientosJornadaSeleccionada[i].nombreJugadorUno = listaEquiposClasificacion[j].nombre;
            if (EnfrentamientosJornadaSeleccionada[i].Ganador === listaEquiposClasificacion[j].id) {
              EnfrentamientosJornadaSeleccionada[i].nombreGanador = listaEquiposClasificacion[j].nombre;
            } else if (EnfrentamientosJornadaSeleccionada[i].Ganador === 0) {
                EnfrentamientosJornadaSeleccionada[i].nombreGanador = 'Empate';
            } else if (EnfrentamientosJornadaSeleccionada[i].Ganador === undefined) {
                EnfrentamientosJornadaSeleccionada[i].nombreGanador = '-';
            }
          } else if (EnfrentamientosJornadaSeleccionada[i].JugadorDos === listaEquiposClasificacion[j].id) {
              EnfrentamientosJornadaSeleccionada[i].nombreJugadorDos = listaEquiposClasificacion[j].nombre;
              if (EnfrentamientosJornadaSeleccionada[i].Ganador === listaEquiposClasificacion[j].id) {
                EnfrentamientosJornadaSeleccionada[i].nombreGanador = listaEquiposClasificacion[j].nombre;
              } else if (EnfrentamientosJornadaSeleccionada[i].Ganador === 0) {
                  EnfrentamientosJornadaSeleccionada[i].nombreGanador = 'Empate';
              } else if (EnfrentamientosJornadaSeleccionada[i].Ganador === undefined) {
                  EnfrentamientosJornadaSeleccionada[i].nombreGanador = '-';
              }
          }
        }
      }
    }
    return EnfrentamientosJornadaSeleccionada;
  }

  public RellenarTablaEquipoJuegoDeCompeticion(rankingJuegoDeCompeticion: TablaEquipoJuegoDeCompeticion[],
                                               informacionPartidos: InformacionPartidosLiga[]): TablaEquipoJuegoDeCompeticion[] {
    console.log();
    for (let cont = 0; cont < rankingJuegoDeCompeticion.length; cont++) {
      rankingJuegoDeCompeticion[cont].partidosTotales = informacionPartidos[cont].partidosTotales;
      rankingJuegoDeCompeticion[cont].partidosJugados = informacionPartidos[cont].partidosJugados;
      rankingJuegoDeCompeticion[cont].partidosGanados = informacionPartidos[cont].partidosGanados;
      rankingJuegoDeCompeticion[cont].partidosEmpatados = informacionPartidos[cont].partidosEmpatados;
      rankingJuegoDeCompeticion[cont].partidosPerdidos = informacionPartidos[cont].partidosPerdidos;
    }
    return rankingJuegoDeCompeticion;
  }

  public RellenarTablaAlumnoJuegoDeCompeticion(rankingJuegoDeCompeticion: TablaAlumnoJuegoDeCompeticion[],
                                               informacionPartidos: InformacionPartidosLiga[]): TablaAlumnoJuegoDeCompeticion[] {
    for (let cont = 0; cont < rankingJuegoDeCompeticion.length; cont++) {
      rankingJuegoDeCompeticion[cont].partidosTotales = informacionPartidos[cont].partidosTotales;
      rankingJuegoDeCompeticion[cont].partidosJugados = informacionPartidos[cont].partidosJugados;
      rankingJuegoDeCompeticion[cont].partidosGanados = informacionPartidos[cont].partidosGanados;
      rankingJuegoDeCompeticion[cont].partidosEmpatados = informacionPartidos[cont].partidosEmpatados;
      rankingJuegoDeCompeticion[cont].partidosPerdidos = informacionPartidos[cont].partidosPerdidos;
    }
    console.log('----------------------------------');
    console.log(rankingJuegoDeCompeticion);
    return rankingJuegoDeCompeticion;
  }

  public ObtenerInformaciónPartidos(listaParticipantesOrdenadaPorPuntos, jornadasDelJuego: Jornada[], individual: boolean,
                                    enfrentamientosDelJuego: Array<Array<EnfrentamientoLiga>>): InformacionPartidosLiga[] {
    this.informacionPartidos = [];
    console.log('Estoy en ObtenerInformacionPartidos()');
    const listaInformacionPartidos: InformacionPartidosLiga[] = [];
    const listaEnfrentamientosDelJuego: EnfrentamientoLiga[] = this.ObtenerListaEnfrentamientosDelJuego(jornadasDelJuego,
                                                                                                      enfrentamientosDelJuego);
    if (individual === false) {
        // tslint:disable-next-line:prefer-for-of
      for (let equipo = 0; equipo < listaParticipantesOrdenadaPorPuntos.length; equipo++) {
        const informacionPartido = new InformacionPartidosLiga(listaParticipantesOrdenadaPorPuntos[equipo].EquipoId, 0, 0, 0, 0, 0);
        console.log(informacionPartido);
        informacionPartido.partidosTotales = this.CalcularPartidosTotales(listaEnfrentamientosDelJuego,
                                                                          listaParticipantesOrdenadaPorPuntos, equipo, individual);
        informacionPartido.partidosJugados = this.CalcularPartidosJugados(listaEnfrentamientosDelJuego,
                                                                          listaParticipantesOrdenadaPorPuntos, equipo, individual);
        informacionPartido.partidosGanados = this.CalcularPartidosGanados(listaEnfrentamientosDelJuego,
                                                                          listaParticipantesOrdenadaPorPuntos, equipo, individual);
        informacionPartido.partidosEmpatados = this.CalcularPartidosEmpatados(listaEnfrentamientosDelJuego,
                                                                              listaParticipantesOrdenadaPorPuntos, equipo, individual);
        informacionPartido.partidosPerdidos = this.CalcularPartidosPerdidos(listaEnfrentamientosDelJuego,
                                                                            listaParticipantesOrdenadaPorPuntos, equipo, individual);
        listaInformacionPartidos.push(informacionPartido);
        console.log('Partidos perdidos del participante id ' + listaParticipantesOrdenadaPorPuntos[equipo].EquipoId + 'son: '
                    + informacionPartido.partidosPerdidos);
      }
    } else if (individual === true) {
        // tslint:disable-next-line:prefer-for-of
      for (let alumno = 0; alumno < listaParticipantesOrdenadaPorPuntos.length; alumno++) {
        const informacionPartido = new InformacionPartidosLiga(listaParticipantesOrdenadaPorPuntos[alumno].AlumnoId, 0, 0, 0, 0, 0);
        console.log(informacionPartido);
        informacionPartido.partidosTotales = this.CalcularPartidosTotales(listaEnfrentamientosDelJuego,
                                                                          listaParticipantesOrdenadaPorPuntos, alumno, individual);
        informacionPartido.partidosJugados = this.CalcularPartidosJugados(listaEnfrentamientosDelJuego,
                                                                          listaParticipantesOrdenadaPorPuntos, alumno, individual);
        informacionPartido.partidosGanados = this.CalcularPartidosGanados(listaEnfrentamientosDelJuego,
                                                                          listaParticipantesOrdenadaPorPuntos, alumno, individual);
        informacionPartido.partidosEmpatados = this.CalcularPartidosEmpatados(listaEnfrentamientosDelJuego,
                                                                              listaParticipantesOrdenadaPorPuntos, alumno, individual);
        informacionPartido.partidosPerdidos = this.CalcularPartidosPerdidos(listaEnfrentamientosDelJuego,
                                                                            listaParticipantesOrdenadaPorPuntos, alumno, individual);
        listaInformacionPartidos.push(informacionPartido);
        console.log('Partidos perdidos del participante id ' + listaParticipantesOrdenadaPorPuntos[alumno].AlumnoId + 'son: '
                    + informacionPartido.partidosPerdidos);
      }
    }
    console.log('La listaInformacionPartidos es: ');
    console.log(listaInformacionPartidos);
    return listaInformacionPartidos;
  }

  public ObtenerListaEnfrentamientosDelJuego(jornadasDelJuego: Jornada[], enfrentamientosDelJuego: EnfrentamientoLiga[][]) {
    const listaEnfrentamientosDelJuego: EnfrentamientoLiga[] = [];
    for (let jornada = 0; jornada < jornadasDelJuego.length; jornada++) {
      // tslint:disable-next-line:prefer-for-of
      for ( let enfrentamiento = 0; enfrentamiento < enfrentamientosDelJuego[jornada].length; enfrentamiento++) {
        listaEnfrentamientosDelJuego.push(enfrentamientosDelJuego[jornada][enfrentamiento]);
      }
    }
    console.log('La lista de enfrentamientos del juego es: ');
    console.log(listaEnfrentamientosDelJuego);
    return listaEnfrentamientosDelJuego;
  }

  public CalcularPartidosTotales(listaEnfrentamientosDelJuego: EnfrentamientoLiga[],
                                 listaParticipantesOrdenadaPorPuntos, participante: number, individual): number {
    let partidosTotales = 0;
    if (individual === false) {
      // tslint:disable-next-line:prefer-for-of
      for (let contEnfrentamiento = 0; contEnfrentamiento < listaEnfrentamientosDelJuego.length; contEnfrentamiento++) {
        if (listaParticipantesOrdenadaPorPuntos[participante].EquipoId === listaEnfrentamientosDelJuego[contEnfrentamiento].JugadorUno ||
            listaParticipantesOrdenadaPorPuntos[participante].EquipoId === listaEnfrentamientosDelJuego[contEnfrentamiento].JugadorDos) {
              partidosTotales++;
        }
      }
    } else if (individual === true) {
      // tslint:disable-next-line:prefer-for-of
      for (let contEnfrentamiento = 0; contEnfrentamiento < listaEnfrentamientosDelJuego.length; contEnfrentamiento++) {
        if (listaParticipantesOrdenadaPorPuntos[participante].AlumnoId === listaEnfrentamientosDelJuego[contEnfrentamiento].JugadorUno ||
            listaParticipantesOrdenadaPorPuntos[participante].AlumnoId === listaEnfrentamientosDelJuego[contEnfrentamiento].JugadorDos) {
              partidosTotales++;
        }
      }
    }
    return partidosTotales;
  }

  public CalcularPartidosJugados(listaEnfrentamientosDelJuego: EnfrentamientoLiga[],
                                 listaParticipantesOrdenadaPorPuntos, participante: number, individual): number {
    let partidosJugados = 0;
    if (individual === false) {
      // tslint:disable-next-line:prefer-for-of
      for (let contEnfrentamiento = 0; contEnfrentamiento < listaEnfrentamientosDelJuego.length; contEnfrentamiento++) {
        if (listaParticipantesOrdenadaPorPuntos[participante].EquipoId === listaEnfrentamientosDelJuego[contEnfrentamiento].JugadorUno ||
            listaParticipantesOrdenadaPorPuntos[participante].EquipoId === listaEnfrentamientosDelJuego[contEnfrentamiento].JugadorDos) {

            if (listaEnfrentamientosDelJuego[contEnfrentamiento].Ganador !== undefined) {
              partidosJugados++;
            }
        }
      }
    } else if (individual === true) {
      // tslint:disable-next-line:prefer-for-of
      for (let contEnfrentamiento = 0; contEnfrentamiento < listaEnfrentamientosDelJuego.length; contEnfrentamiento++) {
        if (listaParticipantesOrdenadaPorPuntos[participante].AlumnoId === listaEnfrentamientosDelJuego[contEnfrentamiento].JugadorUno ||
            listaParticipantesOrdenadaPorPuntos[participante].AlumnoId === listaEnfrentamientosDelJuego[contEnfrentamiento].JugadorDos) {

            if (listaEnfrentamientosDelJuego[contEnfrentamiento].Ganador !== undefined) {
              partidosJugados++;
            }
        }
      }
    }
    return partidosJugados;
  }

  public CalcularPartidosGanados(listaEnfrentamientosDelJuego: EnfrentamientoLiga[],
                                 listaEquiposOrdenadaPorPuntos, participante: number, individual): number {
    let partidosGanados = 0;
    if (individual === false) {
      // tslint:disable-next-line:prefer-for-of
      for (let contEnfrentamiento = 0; contEnfrentamiento < listaEnfrentamientosDelJuego.length; contEnfrentamiento++) {
        if (listaEquiposOrdenadaPorPuntos[participante].EquipoId === listaEnfrentamientosDelJuego[contEnfrentamiento].JugadorUno ||
            listaEquiposOrdenadaPorPuntos[participante].EquipoId === listaEnfrentamientosDelJuego[contEnfrentamiento].JugadorDos) {

            if (listaEquiposOrdenadaPorPuntos[participante].EquipoId === listaEnfrentamientosDelJuego[contEnfrentamiento].Ganador) {
              partidosGanados++;
            }
        }
      }
    } else if (individual === true) {
      // tslint:disable-next-line:prefer-for-of
      for (let contEnfrentamiento = 0; contEnfrentamiento < listaEnfrentamientosDelJuego.length; contEnfrentamiento++) {
        if (listaEquiposOrdenadaPorPuntos[participante].AlumnoId === listaEnfrentamientosDelJuego[contEnfrentamiento].JugadorUno ||
            listaEquiposOrdenadaPorPuntos[participante].AlumnoId === listaEnfrentamientosDelJuego[contEnfrentamiento].JugadorDos) {

            if (listaEquiposOrdenadaPorPuntos[participante].AlumnoId === listaEnfrentamientosDelJuego[contEnfrentamiento].Ganador) {
              partidosGanados++;
            }
        }
      }
    }
    return partidosGanados;
  }

  public CalcularPartidosEmpatados(listaEnfrentamientosDelJuego: EnfrentamientoLiga[],
                                   listaParticipantesOrdenadaPorPuntos,
                                   participante: number, individual): number {
    let partidosEmpatados = 0;
    if (individual === false) {
      // tslint:disable-next-line:prefer-for-of
      for (let contEnfrentamiento = 0; contEnfrentamiento < listaEnfrentamientosDelJuego.length; contEnfrentamiento++) {
        if (listaParticipantesOrdenadaPorPuntos[participante].EquipoId === listaEnfrentamientosDelJuego[contEnfrentamiento].JugadorUno ||
        listaParticipantesOrdenadaPorPuntos[participante].EquipoId === listaEnfrentamientosDelJuego[contEnfrentamiento].JugadorDos) {

          if (listaEnfrentamientosDelJuego[contEnfrentamiento].Ganador === 0) {
            partidosEmpatados++;
          }
        }
      }
    } else if (individual === true) {
      // tslint:disable-next-line:prefer-for-of
      for (let contEnfrentamiento = 0; contEnfrentamiento < listaEnfrentamientosDelJuego.length; contEnfrentamiento++) {
        if (listaParticipantesOrdenadaPorPuntos[participante].AlumnoId === listaEnfrentamientosDelJuego[contEnfrentamiento].JugadorUno ||
        listaParticipantesOrdenadaPorPuntos[participante].AlumnoId === listaEnfrentamientosDelJuego[contEnfrentamiento].JugadorDos) {

          if (listaEnfrentamientosDelJuego[contEnfrentamiento].Ganador === 0) {
            partidosEmpatados++;
          }
        }
      }
    }
    return partidosEmpatados;
  }

  public CalcularPartidosPerdidos(listaEnfrentamientosDelJuego: EnfrentamientoLiga[],
                                  listaParticipantesOrdenadaPorPuntos, contEquipo: number, individual): number {
    let partidosPerdidos = 0;
    if (individual === false) {
      // tslint:disable-next-line:prefer-for-of
      for (let contEnfrentamiento = 0; contEnfrentamiento < listaEnfrentamientosDelJuego.length; contEnfrentamiento++) {
        if (listaParticipantesOrdenadaPorPuntos[contEquipo].EquipoId === listaEnfrentamientosDelJuego[contEnfrentamiento].JugadorUno ||
        listaParticipantesOrdenadaPorPuntos[contEquipo].EquipoId === listaEnfrentamientosDelJuego[contEnfrentamiento].JugadorDos) {

          if ((listaEnfrentamientosDelJuego[contEnfrentamiento].Ganador !== 0 &&
              listaEnfrentamientosDelJuego[contEnfrentamiento].Ganador !== undefined) &&
              listaEnfrentamientosDelJuego[contEnfrentamiento].Ganador !== listaParticipantesOrdenadaPorPuntos[contEquipo].EquipoId) {
            partidosPerdidos++;
          }
        }
      }
    } else if (individual === true) {
      // tslint:disable-next-line:prefer-for-of
      for (let contEnfrentamiento = 0; contEnfrentamiento < listaEnfrentamientosDelJuego.length; contEnfrentamiento++) {
        if (listaParticipantesOrdenadaPorPuntos[contEquipo].AlumnoId === listaEnfrentamientosDelJuego[contEnfrentamiento].JugadorUno ||
        listaParticipantesOrdenadaPorPuntos[contEquipo].AlumnoId === listaEnfrentamientosDelJuego[contEnfrentamiento].JugadorDos) {

          if ((listaEnfrentamientosDelJuego[contEnfrentamiento].Ganador !== 0 &&
              listaEnfrentamientosDelJuego[contEnfrentamiento].Ganador !== undefined) &&
              listaEnfrentamientosDelJuego[contEnfrentamiento].Ganador !== listaParticipantesOrdenadaPorPuntos[contEquipo].AlumnoId) {
            partidosPerdidos++;
          }
        }
      }
    }
    return partidosPerdidos;
  }

  // --------------- Antigua metodología asignar ganadores manualmente --------------- //

  public RevisarMultipleSeleccion(enfrentamientosSeleccionadosColumnaUno: EnfrentamientoLiga[],
                                  enfrentamientosSeleccionadosColumnaDos: EnfrentamientoLiga[],
                                  enfrentamientosSeleccionadosColumnaTres: EnfrentamientoLiga[]) {
    console.log('Selección en ColumnaUno');
    console.log(enfrentamientosSeleccionadosColumnaUno);
    console.log('Selección en ColumnaDos');
    console.log(enfrentamientosSeleccionadosColumnaDos);
    console.log('Selección en ColumnaTres');
    console.log(enfrentamientosSeleccionadosColumnaTres);

    let avisoMasDeUnGanadorMarcadoDosEmpate = false;
    let avisoMasDeUnGanadorMarcadoUnoDos = false;
    let avisoMasDeUnGanadorMarcadoUnoEmpate = false;

    // Segundo miramos si solo hay una selección por enfrentamiento
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < enfrentamientosSeleccionadosColumnaUno.length; i++) {
      // tslint:disable-next-line:prefer-for-of
      for (let j = 0; j < enfrentamientosSeleccionadosColumnaDos.length; j++) {
        if (enfrentamientosSeleccionadosColumnaUno[i].id === enfrentamientosSeleccionadosColumnaDos[j].id) {
            avisoMasDeUnGanadorMarcadoUnoDos = true;
            console.log('Hay alguna selección con ganadorUno y ganadorDos, poner el sweatalert');
            console.log(enfrentamientosSeleccionadosColumnaDos[j]);
            console.log(enfrentamientosSeleccionadosColumnaUno[i].id);
        }
      }
      // tslint:disable-next-line:prefer-for-of
      for (let k = 0; k < enfrentamientosSeleccionadosColumnaTres.length; k++) {
        if (enfrentamientosSeleccionadosColumnaUno[i].id === enfrentamientosSeleccionadosColumnaTres[k].id) {
            avisoMasDeUnGanadorMarcadoUnoEmpate = true;
            console.log('Hay alguna selección con ganadorUno y Empate, poner el sweatalert');
            console.log(enfrentamientosSeleccionadosColumnaUno[i]);
            console.log(enfrentamientosSeleccionadosColumnaTres[k].id);
        }
      }
    }

    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < enfrentamientosSeleccionadosColumnaDos.length; i++) {
      // tslint:disable-next-line:prefer-for-of
      for (let j = 0; j < enfrentamientosSeleccionadosColumnaTres.length; j++) {
        if (enfrentamientosSeleccionadosColumnaDos[i].id === enfrentamientosSeleccionadosColumnaTres[j].id) {
            avisoMasDeUnGanadorMarcadoDosEmpate = true;
            console.log('Hay alguna selección con ganadorDos y Empate, poner sweatalert');
            console.log(enfrentamientosSeleccionadosColumnaDos[i]);
            console.log(enfrentamientosSeleccionadosColumnaTres[j].id);
        }
      }
    }

    // tslint:disable-next-line:max-line-length
    console.log('avisoMasDeUnGanadorMarcadoUnoEmpate = ' + avisoMasDeUnGanadorMarcadoUnoEmpate);
    console.log('avisoMasDeUnGanadorMarcadoDosEmpate = ' + avisoMasDeUnGanadorMarcadoDosEmpate);
    console.log('avisoMasDeUnGanadorMarcadoUnoDos = ' + avisoMasDeUnGanadorMarcadoUnoDos);

    if (avisoMasDeUnGanadorMarcadoDosEmpate === false && avisoMasDeUnGanadorMarcadoUnoDos === false
      && avisoMasDeUnGanadorMarcadoUnoEmpate === false) {
        return false;
    } else {
        return true;
    }
  }

  public AsignarGanadorEquipos(enfrentamientosSeleccionadosColumna: EnfrentamientoLiga[],
                               enfrentamientosJornadaSeleccionada: EnfrentamientoLiga[],
                               listaEquiposClasificacion: TablaEquipoJuegoDeCompeticion[],
                               equiposJuegoDeCompeticionLiga: EquipoJuegoDeCompeticionLiga[],
                               juegoSeleccionado: Juego, ganador: number, Resultados: {buenos: string
                                                                                       malos: string}) {
    console.log('Estoy en AsignarGanadorEquipos()');
    console.log(enfrentamientosSeleccionadosColumna);
    console.log(enfrentamientosJornadaSeleccionada);
    console.log(listaEquiposClasificacion);
    console.log(equiposJuegoDeCompeticionLiga);
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < enfrentamientosSeleccionadosColumna.length; i++) {
      // tslint:disable-next-line:prefer-for-of
      for (let j = 0; j < listaEquiposClasificacion.length; j++) {
        const nombreCompleto = listaEquiposClasificacion[j].nombre;
        if (nombreCompleto === enfrentamientosSeleccionadosColumna[i].nombreJugadorDos && ganador === 2) {
          console.log('He encontrado el equipo: ' + enfrentamientosSeleccionadosColumna[i].nombreJugadorDos);

          // Miramos en la base de datos si para este enfrentamiento ya se había seleccionado un ganador.
          // Si ya estaba asignado que aparezca un mensaje avisando (Si da a aceptar se reasigna el ganador seleccionado, si da a
          // cancelar no se sobreescribe en la base de datos, se queda tal cual)
          // tslint:disable-next-line:prefer-for-of
          for (let k = 0; k < enfrentamientosJornadaSeleccionada.length; k++) {
            // tslint:disable-next-line:max-line-length
            if (enfrentamientosJornadaSeleccionada[k].nombreJugadorUno === enfrentamientosSeleccionadosColumna[i].nombreJugadorUno &&
              // tslint:disable-next-line:max-line-length
              enfrentamientosJornadaSeleccionada[k].nombreJugadorDos === enfrentamientosSeleccionadosColumna[i].nombreJugadorDos) {
                console.log('Ya estoy en el el enfrentamiento que quiero');
                if (enfrentamientosJornadaSeleccionada[k].Ganador === undefined) {
                  console.log('Este enfrentamiento no tiene ganador asignado:');
                  console.log(enfrentamientosJornadaSeleccionada[k]);
                  // Tengo que actualizar el ganador en EnfrentamientoLiga
                  enfrentamientosJornadaSeleccionada[k].Ganador = enfrentamientosSeleccionadosColumna[i].JugadorDos;
                  const enfrentamiento = new EnfrentamientoLiga(enfrentamientosJornadaSeleccionada[k].JugadorUno,
                                                                enfrentamientosJornadaSeleccionada[k].JugadorDos,
                                                                enfrentamientosJornadaSeleccionada[k].Ganador,
                                                                enfrentamientosJornadaSeleccionada[k].JornadaDeCompeticionLigaId,
                                                                undefined, undefined,
                                                                enfrentamientosJornadaSeleccionada[k].id);
                  this.peticionesAPI.PonGanadorDelEnfrentamiento(enfrentamiento).
                  subscribe(res => console.log(res));
                  console.log('El enfrentamiento con el ganador actualizado queda: ');
                  console.log(enfrentamientosJornadaSeleccionada[k]);
                  Resultados.buenos = Resultados.buenos + '\n' + 'Ganador: ' + enfrentamientosSeleccionadosColumna[i].nombreJugadorDos;

                  // Tengo que actualizar el EquipoJuegoDeCompeticionLiga con los nuevos puntos
                  console.log('El equipo ganador es: ' + listaEquiposClasificacion[j].nombre);
                  console.log('Los puntos antes de registrar el partido ganado: ' + listaEquiposClasificacion[j].puntos);
                  listaEquiposClasificacion[j].puntos = listaEquiposClasificacion[j].puntos + 3;
                  console.log('Los puntos actualizados después de registrar el partido ganado: '
                              + listaEquiposClasificacion[j].puntos);
                  console.log(listaEquiposClasificacion[j]);
                  const EquipoId = listaEquiposClasificacion[j].id;
                  console.log('el id del equipo es: ' + EquipoId);
                   // tslint:disable-next-line:prefer-for-of
                  for (let m = 0; m < equiposJuegoDeCompeticionLiga.length; m++) {
                    if (equiposJuegoDeCompeticionLiga[m].EquipoId === EquipoId) {
                      this.EquipoJuegoDeCompeticionLigaId = equiposJuegoDeCompeticionLiga[m].id;
                    }
                  }
                  const equipoGanador = new EquipoJuegoDeCompeticionLiga(EquipoId,
                                                                         juegoSeleccionado.id,
                                                                         listaEquiposClasificacion[j].puntos,
                                                                         this.EquipoJuegoDeCompeticionLigaId);
                  console.log(equipoGanador);
                  console.log('El id del alumno es: ' + equipoGanador.EquipoId + ' y los puntos actualizados son: '
                              + equipoGanador.PuntosTotalesEquipo);
                  this.peticionesAPI.PonPuntosEquipoGanadorJuegoDeCompeticionLiga(equipoGanador).
                  subscribe(res => console.log(res));
                } else {
                  console.log('Este enfrentamiento ya tiene asignado un ganador: ');
                  console.log(enfrentamientosJornadaSeleccionada[k]);
                  Resultados.malos = Resultados.malos + ' ' + (k + 1) + 'º';
                }
              }
          }
        } else if (nombreCompleto === enfrentamientosSeleccionadosColumna[i].nombreJugadorUno && ganador === 1) {
          console.log('He encontrado el equipo: ' + enfrentamientosSeleccionadosColumna[i].nombreJugadorUno);

          // Miramos en la base de datos si para este enfrentamiento ya se había seleccionado un ganador.
          // Si ya estaba asignado que aparezca un mensaje avisando (Si da a aceptar se reasigna el ganador seleccionado, si da a
          // cancelar no se sobreescribe en la base de datos, se queda tal cual)
          // tslint:disable-next-line:prefer-for-of
          for (let k = 0; k < enfrentamientosJornadaSeleccionada.length; k++) {
            // tslint:disable-next-line:max-line-length
            if (enfrentamientosJornadaSeleccionada[k].nombreJugadorUno === enfrentamientosSeleccionadosColumna[i].nombreJugadorUno &&
              // tslint:disable-next-line:max-line-length
              enfrentamientosJornadaSeleccionada[k].nombreJugadorDos === enfrentamientosSeleccionadosColumna[i].nombreJugadorDos) {
                console.log('Ya estoy en el el enfrentamiento que quiero');
                if (enfrentamientosJornadaSeleccionada[k].Ganador === undefined) {
                  console.log('Este enfrentamiento no tiene ganador asignado:');
                  console.log(enfrentamientosJornadaSeleccionada[k]);
                  // Tengo que actualizar el ganador en EnfrentamientoLiga
                  enfrentamientosJornadaSeleccionada[k].Ganador = enfrentamientosSeleccionadosColumna[i].JugadorUno;
                  const enfrentamiento = new EnfrentamientoLiga(enfrentamientosJornadaSeleccionada[k].JugadorUno,
                                                                enfrentamientosJornadaSeleccionada[k].JugadorDos,
                                                                enfrentamientosJornadaSeleccionada[k].Ganador,
                                                                enfrentamientosJornadaSeleccionada[k].JornadaDeCompeticionLigaId,
                                                                undefined, undefined,
                                                                enfrentamientosJornadaSeleccionada[k].id);
                  this.peticionesAPI.PonGanadorDelEnfrentamiento(enfrentamiento).
                  subscribe(res => console.log(res));
                  console.log('El enfrentamiento con el ganador actualizado queda: ');
                  console.log(enfrentamientosJornadaSeleccionada[k]);
                  Resultados.buenos = Resultados.buenos + '\n' + 'Ganador: ' + enfrentamientosSeleccionadosColumna[i].nombreJugadorDos;

                  // Tengo que actualizar el EquipoJuegoDeCompeticionLiga con los nuevos puntos
                  console.log('El equipo ganador es: ' + listaEquiposClasificacion[j].nombre);
                  console.log('Los puntos antes de registrar el partido ganado: ' + listaEquiposClasificacion[j].puntos);
                  listaEquiposClasificacion[j].puntos = listaEquiposClasificacion[j].puntos + 3;
                  console.log('Los puntos actualizados después de registrar el partido ganado: '
                              + listaEquiposClasificacion[j].puntos);
                  console.log(listaEquiposClasificacion[j]);
                  const EquipoId = listaEquiposClasificacion[j].id;
                  console.log('el id del equipo es: ' + EquipoId);
                   // tslint:disable-next-line:prefer-for-of
                  for (let m = 0; m < equiposJuegoDeCompeticionLiga.length; m++) {
                    if (equiposJuegoDeCompeticionLiga[m].EquipoId === EquipoId) {
                      this.EquipoJuegoDeCompeticionLigaId = equiposJuegoDeCompeticionLiga[m].id;
                    }
                  }
                  const equipoGanador = new EquipoJuegoDeCompeticionLiga(EquipoId,
                                                                         juegoSeleccionado.id,
                                                                         listaEquiposClasificacion[j].puntos,
                                                                         this.EquipoJuegoDeCompeticionLigaId);
                  console.log(equipoGanador);
                  console.log('El id del alumno es: ' + equipoGanador.EquipoId + ' y los puntos actualizados son: '
                              + equipoGanador.PuntosTotalesEquipo);
                  this.peticionesAPI.PonPuntosEquipoGanadorJuegoDeCompeticionLiga(equipoGanador).
                  subscribe(res => console.log(res));
                } else {
                  console.log('Este enfrentamiento ya tiene asignado un ganador: ');
                  console.log(enfrentamientosJornadaSeleccionada[k]);
                  Resultados.malos = Resultados.malos + ' ' + (k + 1) + 'º';
                }
              }
          }
        }
      }
    }
    return Resultados;
  }

  public AsignarGanadorIndividual(enfrentamientosSeleccionadosColumna: EnfrentamientoLiga[],
                                  enfrentamientosJornadaSeleccionada: EnfrentamientoLiga[],
                                  listaAlumnosClasificacion: TablaAlumnoJuegoDeCompeticion[],
                                  alumnosJuegoDeCompeticionLiga: AlumnoJuegoDeCompeticionLiga[],
                                  juegoSeleccionado: Juego, ganador: number, Resultados: {buenos: string
                                                                                          malos: string}) {
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < enfrentamientosSeleccionadosColumna.length; i++) {
      // tslint:disable-next-line:prefer-for-of
      for (let j = 0; j < listaAlumnosClasificacion.length; j++) {
        const nombreCompleto = listaAlumnosClasificacion[j].nombre + ' ' + listaAlumnosClasificacion[j].primerApellido
                             + ' ' + listaAlumnosClasificacion[j].segundoApellido;
        //  GANADOR COLUMNA DOS
        if (nombreCompleto === enfrentamientosSeleccionadosColumna[i].nombreJugadorDos && ganador === 2) {
          console.log('He encontrado el alumno: ' + enfrentamientosSeleccionadosColumna[i].nombreJugadorDos);

          // Miramos en la base de datos si para este enfrentamiento ya se había seleccionado un ganador.
          // Si ya estaba asignado que aparezca un mensaje avisando (Si da a aceptar se reasigna el ganador seleccionado, si da a
          // cancelar no se sobreescribe en la base de datos, se queda tal cual)
          // tslint:disable-next-line:prefer-for-of
          for (let k = 0; k < enfrentamientosJornadaSeleccionada.length; k++) {
            // tslint:disable-next-line:max-line-length
            if (enfrentamientosJornadaSeleccionada[k].nombreJugadorUno === enfrentamientosSeleccionadosColumna[i].nombreJugadorUno &&
                // tslint:disable-next-line:max-line-length
                enfrentamientosJornadaSeleccionada[k].nombreJugadorDos === enfrentamientosSeleccionadosColumna[i].nombreJugadorDos) {
              console.log('Ya estoy en el el enfrentamiento que quiero');
              if (enfrentamientosJornadaSeleccionada[k].Ganador === undefined) {
                console.log('Este enfrentamiento no tiene ganador asignado:');
                console.log(enfrentamientosJornadaSeleccionada[k]);
                // Tengo que actualizar el ganador en EnfrentamientoLiga
                enfrentamientosJornadaSeleccionada[k].Ganador = enfrentamientosSeleccionadosColumna[i].JugadorDos;
                const enfrentamiento = new EnfrentamientoLiga(enfrentamientosJornadaSeleccionada[k].JugadorUno,
                                                              enfrentamientosJornadaSeleccionada[k].JugadorDos,
                                                              enfrentamientosJornadaSeleccionada[k].Ganador,
                                                              enfrentamientosJornadaSeleccionada[k].JornadaDeCompeticionLigaId,
                                                              undefined, undefined,
                                                              enfrentamientosJornadaSeleccionada[k].id);
                this.peticionesAPI.PonGanadorDelEnfrentamiento(enfrentamiento).
                subscribe(res => console.log(res));
                console.log('El enfrentamiento con el ganador actualizado queda: ');
                console.log(enfrentamientosJornadaSeleccionada[k]);
                Resultados.buenos = Resultados.buenos + '\n' + 'Ganador: ' + enfrentamientosSeleccionadosColumna[i].nombreJugadorDos;

                // Tengo que actualizar el AlumnoJuegoDeCompeticionLiga con los nuevos puntos
                console.log('El alumno ganador es: ' + listaAlumnosClasificacion[j].nombre);
                console.log('Los puntos antes de registrar el partido ganado: ' + listaAlumnosClasificacion[j].puntos);
                listaAlumnosClasificacion[j].puntos = listaAlumnosClasificacion[j].puntos + 3;
                console.log('Los puntos actualizados después de registrar el partido ganado: '
                            + listaAlumnosClasificacion[j].puntos);
                console.log(listaAlumnosClasificacion[j]);
                const AlumnoId = listaAlumnosClasificacion[j].id;
                console.log('el id del alumno es: ' + AlumnoId);
                // tslint:disable-next-line:prefer-for-of
                for (let m = 0; m < alumnosJuegoDeCompeticionLiga.length; m++) {
                  if (alumnosJuegoDeCompeticionLiga[m].AlumnoId === AlumnoId) {
                    this.AlumnoJuegoDeCompeticionLigaId = alumnosJuegoDeCompeticionLiga[m].id;
                  }
                }
                const alumnoGanador = new AlumnoJuegoDeCompeticionLiga(AlumnoId,
                                                                       juegoSeleccionado.id,
                                                                       listaAlumnosClasificacion[j].puntos,
                                                                       this.AlumnoJuegoDeCompeticionLigaId);
                console.log(alumnoGanador);
                console.log('El id del alumno es: ' + alumnoGanador.AlumnoId + ' y los puntos actualizados son: '
                            + alumnoGanador.PuntosTotalesAlumno);
                this.peticionesAPI.PonPuntosAlumnoGanadorJuegoDeCompeticionLiga(alumnoGanador).
                subscribe(res => console.log(res));
              } else {
                console.log('Este enfrentamiento ya tiene asignado un ganador: ');
                console.log(enfrentamientosJornadaSeleccionada[k]);
                Resultados.malos = Resultados.malos + ' ' + (k + 1) + 'º';
              }
            }
          }
        //  GANADOR COLUMNA DOS
        } else if (nombreCompleto === enfrentamientosSeleccionadosColumna[i].nombreJugadorUno && ganador === 1) {
          console.log('He encontrado el alumno: ' + enfrentamientosSeleccionadosColumna[i].nombreJugadorUno);

          // Miramos en la base de datos si para este enfrentamiento ya se había seleccionado un ganador.
          // Si ya estaba asignado que aparezca un mensaje avisando (Si da a aceptar se reasigna el ganador seleccionado, si da a
          // cancelar no se sobreescribe en la base de datos, se queda tal cual)
          // tslint:disable-next-line:prefer-for-of
          for (let k = 0; k < enfrentamientosJornadaSeleccionada.length; k++) {
            // tslint:disable-next-line:max-line-length
            if (enfrentamientosJornadaSeleccionada[k].nombreJugadorUno === enfrentamientosSeleccionadosColumna[i].nombreJugadorUno &&
                // tslint:disable-next-line:max-line-length
                enfrentamientosJornadaSeleccionada[k].nombreJugadorDos === enfrentamientosSeleccionadosColumna[i].nombreJugadorDos) {
              console.log('Ya estoy en el el enfrentamiento que quiero');
              if (enfrentamientosJornadaSeleccionada[k].Ganador === undefined) {
                console.log('Este enfrentamiento no tiene ganador asignado:');
                console.log(enfrentamientosJornadaSeleccionada[k]);
                // Tengo que actualizar el ganador en EnfrentamientoLiga
                enfrentamientosJornadaSeleccionada[k].Ganador = enfrentamientosSeleccionadosColumna[i].JugadorUno;
                const enfrentamiento = new EnfrentamientoLiga(enfrentamientosJornadaSeleccionada[k].JugadorUno,
                                                              enfrentamientosJornadaSeleccionada[k].JugadorDos,
                                                              enfrentamientosJornadaSeleccionada[k].Ganador,
                                                              enfrentamientosJornadaSeleccionada[k].JornadaDeCompeticionLigaId,
                                                              undefined, undefined,
                                                              enfrentamientosJornadaSeleccionada[k].id);
                this.peticionesAPI.PonGanadorDelEnfrentamiento(enfrentamiento).
                subscribe(res => console.log(res));
                console.log('El enfrentamiento con el ganador actualizado queda: ');
                console.log(enfrentamientosJornadaSeleccionada[k]);
                Resultados.buenos = Resultados.buenos + '\n' + 'Ganador: ' + enfrentamientosSeleccionadosColumna[i].nombreJugadorUno;

                // Tengo que actualizar el AlumnoJuegoDeCompeticionLiga con los nuevos puntos
                console.log('El alumno ganador es: ' + listaAlumnosClasificacion[j].nombre);
                console.log('Los puntos antes de registrar el partido ganado: ' + listaAlumnosClasificacion[j].puntos);
                listaAlumnosClasificacion[j].puntos = listaAlumnosClasificacion[j].puntos + 3;
                console.log('Los puntos actualizados después de registrar el partido ganado: '
                            + listaAlumnosClasificacion[j].puntos);
                console.log(listaAlumnosClasificacion[j]);
                const AlumnoId = listaAlumnosClasificacion[j].id;
                console.log('el id del alumno es: ' + AlumnoId);
                // tslint:disable-next-line:prefer-for-of
                for (let m = 0; m < alumnosJuegoDeCompeticionLiga.length; m++) {
                  if (alumnosJuegoDeCompeticionLiga[m].AlumnoId === AlumnoId) {
                    this.AlumnoJuegoDeCompeticionLigaId = alumnosJuegoDeCompeticionLiga[m].id;
                  }
                }
                const alumnoGanador = new AlumnoJuegoDeCompeticionLiga(AlumnoId,
                                                                       juegoSeleccionado.id,
                                                                       listaAlumnosClasificacion[j].puntos,
                                                                       this.AlumnoJuegoDeCompeticionLigaId);
                console.log(alumnoGanador);
                console.log('El id del alumno es: ' + alumnoGanador.AlumnoId + ' y los puntos actualizados son: '
                            + alumnoGanador.PuntosTotalesAlumno);
                this.peticionesAPI.PonPuntosAlumnoGanadorJuegoDeCompeticionLiga(alumnoGanador).
                subscribe(res => console.log(res));
              } else {
                console.log('Este enfrentamiento ya tiene asignado un ganador: ');
                console.log(enfrentamientosJornadaSeleccionada[k]);
                Resultados.malos = Resultados.malos + ' ' + (k + 1) + 'º';
              }
            }
          }

        }
      }
    }
    return Resultados;
  }

  public AsignarEmpateIndividual(enfrentamientosSeleccionadosColumna: EnfrentamientoLiga[],
                                 enfrentamientosJornadaSeleccionada: EnfrentamientoLiga[],
                                 listaAlumnosClasificacion: TablaAlumnoJuegoDeCompeticion[],
                                 alumnosJuegoDeCompeticionLiga: AlumnoJuegoDeCompeticionLiga[],
                                 juegoSeleccionado: Juego, Resultados: {buenos: string
                                                                        malos: string}) {
    let alumnosConPuntosSumados = 0;
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < enfrentamientosSeleccionadosColumna.length; i++) {
      let enfrentamientoEmpateRegistrado = false;
      // tslint:disable-next-line:prefer-for-of
      for (let j = 0; j < listaAlumnosClasificacion.length; j++) {
        const nombreCompleto = listaAlumnosClasificacion[j].nombre + ' ' + listaAlumnosClasificacion[j].primerApellido
                             + ' ' + listaAlumnosClasificacion[j].segundoApellido;
        if (nombreCompleto === enfrentamientosSeleccionadosColumna[i].nombreJugadorDos ||
            nombreCompleto === enfrentamientosSeleccionadosColumna[i].nombreJugadorUno) {
          console.log('He encontrado el alumno: ' + nombreCompleto);
          console.log('Los puntos antes de registrar el partido ganado: ' + listaAlumnosClasificacion[j].puntos);

          // Miramos en la base de datos si para este enfrentamiento ya se había seleccionado un ganador.
          // Si ya estaba asignado que aparezca un mensaje avisando (Si da a aceptar se reasigna el ganador seleccionado, si da a
          // cancelar no se sobreescribe en la base de datos, se queda tal cual)
          // tslint:disable-next-line:prefer-for-of
          for (let k = 0; k < enfrentamientosJornadaSeleccionada.length; k++) {
            // tslint:disable-next-line:max-line-length
            if (enfrentamientosJornadaSeleccionada[k].nombreJugadorUno === enfrentamientosSeleccionadosColumna[i].nombreJugadorUno &&
                // tslint:disable-next-line:max-line-length
                enfrentamientosJornadaSeleccionada[k].nombreJugadorDos === enfrentamientosSeleccionadosColumna[i].nombreJugadorDos) {
              console.log('Ya estoy en el el enfrentamiento que quiero');
              if (enfrentamientosJornadaSeleccionada[k].Ganador === undefined) {
                console.log('Este enfrentamiento no tiene ganador asignado:');
                // Ahora tengo que actualizar los dos AlumnoJuegoDeCompeticionLiga del enfrentamiento con los nuevos puntos
                listaAlumnosClasificacion[j].puntos = listaAlumnosClasificacion[j].puntos + 1;
                console.log('Los puntos actualizados después de registrar el partido ganado: '
                            + listaAlumnosClasificacion[j].puntos);
                console.log(listaAlumnosClasificacion[j]);
                console.log('el id del alumno es: ' + listaAlumnosClasificacion[j].id);
                const AlumnoId = listaAlumnosClasificacion[j].id;
                // tslint:disable-next-line:prefer-for-of
                for (let m = 0; m < alumnosJuegoDeCompeticionLiga.length; m++) {
                  if (alumnosJuegoDeCompeticionLiga[m].AlumnoId === AlumnoId) {
                    this.AlumnoJuegoDeCompeticionLigaId = alumnosJuegoDeCompeticionLiga[m].id;
                  }
                }
                const alumnoGanador = new AlumnoJuegoDeCompeticionLiga(AlumnoId,
                                                                      juegoSeleccionado.id,
                                                                      listaAlumnosClasificacion[j].puntos,
                                                                      this.AlumnoJuegoDeCompeticionLigaId);
                console.log(alumnoGanador);
                console.log('El id del alumno es: ' + alumnoGanador.AlumnoId + ' y los puntos son: '
                            + alumnoGanador.PuntosTotalesAlumno);
                alumnosConPuntosSumados++;
                this.peticionesAPI.PonPuntosAlumnoGanadorJuegoDeCompeticionLiga(alumnoGanador).
                subscribe(res => console.log(res));

                if (alumnosConPuntosSumados === 2 && enfrentamientoEmpateRegistrado === false) {
                  alumnosConPuntosSumados = 0;
                  enfrentamientoEmpateRegistrado = true;
                  enfrentamientosJornadaSeleccionada[k].Ganador = 0;
                  console.log(enfrentamientosJornadaSeleccionada[k]);
                  const enfrentamiento = new EnfrentamientoLiga(enfrentamientosJornadaSeleccionada[k].JugadorUno,
                                                                enfrentamientosJornadaSeleccionada[k].JugadorDos,
                                                                enfrentamientosJornadaSeleccionada[k].Ganador,
                                                                enfrentamientosJornadaSeleccionada[k].JornadaDeCompeticionLigaId,
                                                                undefined, undefined,
                                                                enfrentamientosJornadaSeleccionada[k].id);
                  this.peticionesAPI.PonGanadorDelEnfrentamiento(enfrentamiento).
                  subscribe(res => console.log(res));
                  Resultados.buenos = Resultados.buenos + '\n' + 'Empate';
                }
              } else {
                this.empateAsignado++;
                if (this.empateAsignado === 2) {
                  this.empateAsignado = 0;
                  console.log('Este enfrentamiento ya tiene asignado un ganador: ');
                  console.log(enfrentamientosJornadaSeleccionada[k]);
                  Resultados.malos = Resultados.malos + ' ' + (k + 1) + 'º';
                }
              }
            }
          }

        }
      }
    }
    return Resultados;
  }

  public AsignarEmpateEquipos(enfrentamientosSeleccionadosColumna: EnfrentamientoLiga[],
                              enfrentamientosJornadaSeleccionada: EnfrentamientoLiga[],
                              listaEquiposClasificacion: TablaEquipoJuegoDeCompeticion[],
                              equiposJuegoDeCompeticionLiga: EquipoJuegoDeCompeticionLiga[],
                              juegoSeleccionado: Juego, Resultados: {buenos: string
                                                                     malos: string}) {
    let equiposConPuntosSumados = 0;
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < enfrentamientosSeleccionadosColumna.length; i++) {
      let enfrentamientoEmpateRegistrado = false;
      // tslint:disable-next-line:prefer-for-of
      for (let j = 0; j < listaEquiposClasificacion.length; j++) {
        const nombreCompleto = listaEquiposClasificacion[j].nombre;
        if (nombreCompleto === enfrentamientosSeleccionadosColumna[i].nombreJugadorDos ||
            nombreCompleto === enfrentamientosSeleccionadosColumna[i].nombreJugadorUno) {
          console.log('He encontrado el equipo: ' + enfrentamientosSeleccionadosColumna[i].nombreJugadorDos);
          console.log('Los puntos antes de registrar el partido ganado: ' + listaEquiposClasificacion[j].puntos);

          // Miramos en la base de datos si para este enfrentamiento ya se había seleccionado un ganador.
          // Si ya estaba asignado que aparezca un mensaje avisando (Si da a aceptar se reasigna el ganador seleccionado, si da a
          // cancelar no se sobreescribe en la base de datos, se queda tal cual)
          // tslint:disable-next-line:prefer-for-of
          for (let k = 0; k < enfrentamientosJornadaSeleccionada.length; k++) {
            // tslint:disable-next-line:max-line-length
            if (enfrentamientosJornadaSeleccionada[k].nombreJugadorUno === enfrentamientosSeleccionadosColumna[i].nombreJugadorUno &&
                // tslint:disable-next-line:max-line-length
                enfrentamientosJornadaSeleccionada[k].nombreJugadorDos === enfrentamientosSeleccionadosColumna[i].nombreJugadorDos) {
              console.log('Ya estoy en el el enfrentamiento que quiero');
              if (enfrentamientosJornadaSeleccionada[k].Ganador === undefined) {
                console.log('Este enfrentamiento no tiene ganador asignado:');
                // Ahora tengo que actualizar los dos AlumnoJuegoDeCompeticionLiga del enfrentamiento con los nuevos puntos
                listaEquiposClasificacion[j].puntos = listaEquiposClasificacion[j].puntos + 1;
                console.log('Los puntos actualizados después de registrar el partido ganado: '
                            + listaEquiposClasificacion[j].puntos);
                console.log(listaEquiposClasificacion[j]);
                console.log('el id del equipo es: ' + listaEquiposClasificacion[j].id);
                const EquipoId = listaEquiposClasificacion[j].id;
                // tslint:disable-next-line:prefer-for-of
                for (let m = 0; m < equiposJuegoDeCompeticionLiga.length; m++) {
                  if (equiposJuegoDeCompeticionLiga[m].EquipoId === EquipoId) {
                    this.EquipoJuegoDeCompeticionLigaId = equiposJuegoDeCompeticionLiga[m].id;
                  }
                }
                const equipoEmpatado = new EquipoJuegoDeCompeticionLiga(EquipoId,
                                                                        juegoSeleccionado.id,
                                                                        listaEquiposClasificacion[j].puntos,
                                                                        this.EquipoJuegoDeCompeticionLigaId);
                console.log(equipoEmpatado);
                console.log('El id del equipo es: ' + equipoEmpatado.EquipoId + ' y los puntos son: '
                            + equipoEmpatado.PuntosTotalesEquipo);
                equiposConPuntosSumados++;
                this.peticionesAPI.PonPuntosEquipoGanadorJuegoDeCompeticionLiga(equipoEmpatado).
                subscribe(res => console.log(res));

                if (equiposConPuntosSumados === 2 && enfrentamientoEmpateRegistrado === false) {
                  equiposConPuntosSumados = 0;
                  enfrentamientoEmpateRegistrado = true;
                  enfrentamientosJornadaSeleccionada[k].Ganador = 0;
                  console.log(enfrentamientosJornadaSeleccionada[k]);
                  const enfrentamiento = new EnfrentamientoLiga(enfrentamientosJornadaSeleccionada[k].JugadorUno,
                                                                enfrentamientosJornadaSeleccionada[k].JugadorDos,
                                                                enfrentamientosJornadaSeleccionada[k].Ganador,
                                                                enfrentamientosJornadaSeleccionada[k].JornadaDeCompeticionLigaId,
                                                                undefined, undefined,
                                                                enfrentamientosJornadaSeleccionada[k].id);
                  this.peticionesAPI.PonGanadorDelEnfrentamiento(enfrentamiento).
                  subscribe(res => console.log(res));
                  Resultados.buenos = Resultados.buenos + '\n' + 'Empate';
                }
              } else {
                console.log('Este enfrentamiento ya tiene asignado un ganador: ');
                console.log(enfrentamientosJornadaSeleccionada[k]);
                this.empateAsignado++;
                if (this.empateAsignado === 2) {
                  this.empateAsignado = 0;
                  console.log('Este enfrentamiento ya tiene asignado un ganador: ');
                  console.log(enfrentamientosJornadaSeleccionada[k]);
                  Resultados.malos = Resultados.malos + ' ' + (k + 1) + 'º';
                }
              }
            }
          }

        }
      }
    }
    return Resultados;
  }



// --------------- Nueva metodología asignar ganadores manualmente --------------- //

  public AsignarResultadosJornadaLiga(juego: Juego, jornadaId: number, resultados: number[]) {
    const indexEnfrentamientosConResultadosPreviamente: number[] = [];
    let tieneGanadores = false;
    // Primero necesitamos los enfrentamientos de la jornada
    this.peticionesAPI.DameEnfrentamientosDeCadaJornadaLiga(jornadaId)
    .subscribe(enfrentamientosJornadaSeleccionada => {
      console.log('Los enfrentamientos de la jornada son: ');
      console.log(enfrentamientosJornadaSeleccionada);

      if (resultados.length === enfrentamientosJornadaSeleccionada.length) {
        console.log('resultados.length === enfrentamientosJornadaSeleccionada.length');

        for (let indexEnfrentamientos = 0; indexEnfrentamientos < enfrentamientosJornadaSeleccionada.length; indexEnfrentamientos++) {
          const numeroEnfrentamiento = indexEnfrentamientos + 1;
          // Si el enfrentamiento no tenía ganadores
          // --> actualizar enfrentamiento con los ganadores seleccionados y actualizar puntos de los particupantes
          console.log('numeroEnfrentamiento' + numeroEnfrentamiento);
          console.log('ganador = ' + enfrentamientosJornadaSeleccionada[indexEnfrentamientos].Ganador);
          if (enfrentamientosJornadaSeleccionada[indexEnfrentamientos].Ganador === undefined) {

            // Actualizamos el ganador en EnfrentamientoLiga
            this.GuardarGanadorEnfrentamiento(enfrentamientosJornadaSeleccionada[indexEnfrentamientos],
                                              resultados[indexEnfrentamientos]);
            // Actualizamos los puntos de los participantes
            this.ActualizarPuntosParticipantesEnfrentamiento(juego, enfrentamientosJornadaSeleccionada[indexEnfrentamientos],
                                                             resultados[indexEnfrentamientos]);
          } else {  // el enfrentamiento tenía ganadores
            indexEnfrentamientosConResultadosPreviamente.push(indexEnfrentamientos);
            console.log('El enfrentamiento ya tenía ganadores');
            tieneGanadores = true;

          }
        }
        if (tieneGanadores === true) {
          Swal.fire('Esta jornada ya tiene ganadores', '', 'error');
        } else {
          Swal.fire('Resultados asignados', 'Enhorabuena', 'success');
        }

        // Mensaje sweetalert
        console.log('indexEnfrentamientosConResultadosPreviamente');
        console.log(indexEnfrentamientosConResultadosPreviamente);
        // no sé como hacer para devolver Mensaje
        const Mensaje = this.MensajeSweetalert(juego, enfrentamientosJornadaSeleccionada, resultados,
                                               indexEnfrentamientosConResultadosPreviamente);
      } else {
        console.log('Se ha producido algún error: resultados.length !== enfrentamientosJornadaSeleccionada.length');
      }
      console.log('indexEnfrentamientosConResultadosPreviamente:');
      console.log(indexEnfrentamientosConResultadosPreviamente);
    });
  }

  public GuardarGanadorEnfrentamiento(enfrentamiento: EnfrentamientoLiga, resultado: number) {
    let enfrentamientoActualizado: EnfrentamientoLiga;

    if (resultado === 1) {
      enfrentamiento.Ganador = enfrentamiento.JugadorUno;
    } else if (resultado === 2) {
      enfrentamiento.Ganador = enfrentamiento.JugadorDos;
    } else if (resultado === 0) {
      enfrentamiento.Ganador = 0;
    } else if (resultado === -1) {
    }

    if (resultado === 1 || resultado === 2 || resultado === 0) {
      enfrentamientoActualizado = new EnfrentamientoLiga(enfrentamiento.JugadorUno,
                                                         enfrentamiento.JugadorDos,
                                                         enfrentamiento.Ganador,
                                                         enfrentamiento.JornadaDeCompeticionLigaId,
                                                         undefined, undefined,
                                                         enfrentamiento.id);
      console.log('enfrentamientoActualizado');
      console.log(enfrentamientoActualizado);
      this.peticionesAPI.PonGanadorDelEnfrentamiento(enfrentamientoActualizado).
      subscribe(res => console.log(res));
      console.log('El enfrentamiento con el ganador actualizado queda: ');
      console.log(enfrentamientoActualizado);
    }
  }

  public ActualizarPuntosParticipantesEnfrentamiento(juego: Juego, enfrentamiento: EnfrentamientoLiga, resultado: number) {

    if (juego.Modo === 'Individual') {
      console.log('Estoy en ActualizarPuntosParticipantesEnfrentamiento() Individual');
      let alumnoGanador: AlumnoJuegoDeCompeticionLiga[] = [];
      this.peticionesAPI.DameInscripcionesAlumnoJuegoDeCompeticionLiga(juego.id)
      .subscribe(alumnosJuegoLiga => {
        if (resultado === 1 || resultado === 2) {
          alumnoGanador = alumnosJuegoLiga.filter(alumno => alumno.AlumnoId === enfrentamiento.Ganador);
          alumnoGanador[0].PuntosTotalesAlumno = alumnoGanador[0].PuntosTotalesAlumno + 3;
        } else if (resultado === 0) {
          alumnoGanador.push(alumnosJuegoLiga.filter (alumno => alumno.AlumnoId === enfrentamiento.JugadorUno)[0]);
          alumnoGanador.push(alumnosJuegoLiga.filter (alumno => alumno.AlumnoId === enfrentamiento.JugadorDos)[0]);
          alumnoGanador.forEach(alumno => {
            alumno.PuntosTotalesAlumno = alumno.PuntosTotalesAlumno + 1;
          });
        }
        console.log('alumnoGanador:');
        console.log(alumnoGanador);
        alumnoGanador.forEach(alumno => {
          this.peticionesAPI.PonPuntosAlumnoGanadorJuegoDeCompeticionLiga(alumno)
          .subscribe(res => console.log(res));
        });
      });

    } else {
      console.log('Estoy en ActualizarPuntosParticipantesEnfrentamiento() Equipo');
      let equipoGanador: EquipoJuegoDeCompeticionLiga[] = [];
      this.peticionesAPI.DameInscripcionesEquipoJuegoDeCompeticionLiga(juego.id)
      .subscribe(equiposJuegoLiga => {
        if (resultado === 1 || resultado === 2) {
          equipoGanador = equiposJuegoLiga.filter(equipo => equipo.EquipoId === enfrentamiento.Ganador);
          equipoGanador[0].PuntosTotalesEquipo = equipoGanador[0].PuntosTotalesEquipo + 3;
        } else if (resultado === 0) {
          equipoGanador.push(equiposJuegoLiga.filter (equipo => equipo.EquipoId === enfrentamiento.JugadorUno)[0]);
          equipoGanador.push(equiposJuegoLiga.filter (equipo => equipo.EquipoId === enfrentamiento.JugadorDos)[0]);
          equipoGanador.forEach(equipo => {
            equipo.PuntosTotalesEquipo = equipo.PuntosTotalesEquipo + 1;
          });
        }
        console.log('equipoGanador:');
        console.log(equipoGanador);
        equipoGanador.forEach(equipo => {
          this.peticionesAPI.PonPuntosEquipoGanadorJuegoDeCompeticionLiga(equipo)
          .subscribe(res => console.log(res));
        });
      });
    }
  }

  public MensajeSweetalert(juego: Juego, enfrentamientosJornadaSeleccionada: EnfrentamientoLiga[], resultados: number[],
                           indexEnfrentamientosConResultadosPreviamente: number[]) {
    console.log('Estoy en MensajeSweetalert()');
    console.log(enfrentamientosJornadaSeleccionada);
    const Mensaje: {
      buenos: string
      malos: string
    } = {buenos: '', malos: 'Los enfrentamientos: '};
    if (juego.Modo === 'Individual') {
      // Saco todos los alumnos de la BD para poder asociar el id del ganador con un nombre y apellidos de un alumno
      this.peticionesAPI.DameAlumnos()
      .subscribe(alumnos => {
        if ( resultados.length === enfrentamientosJornadaSeleccionada.length) {
          for (let indexEnfrentamientos = 0; indexEnfrentamientos < enfrentamientosJornadaSeleccionada.length; indexEnfrentamientos++) {
            const posicion = indexEnfrentamientosConResultadosPreviamente.indexOf(indexEnfrentamientos);
            console.log('posicion' + posicion);
            // si el enfrentamiento no está en el vector de enfrentamientos con resultados es mensaje bueno
            if (posicion === -1) {
              const numeroEnfrentamiento = indexEnfrentamientos + 1;
              console.log('numeroEnfrentamiento = ' + numeroEnfrentamiento);

              console.log('El enfrentamiento: ' + (indexEnfrentamientos + 1) + 'º no tiene ganadores');
              if (resultados[indexEnfrentamientos] === 0) {
                Mensaje.buenos = Mensaje.buenos + '\n' + 'Empate ';
              } else if (resultados[indexEnfrentamientos] === -1) {
                const a = 0;
                console.log('enfrentamiento para el que no se ha seleccionado ganador');
              } else {  // resultados[indexEnfrentamientos] === 1 || resultados[indexEnfrentamientos] === 2
                const alumnoGanador = alumnos.filter(alumno => alumno.id ===
                                                    enfrentamientosJornadaSeleccionada[indexEnfrentamientos].Ganador)[0];
                Mensaje.buenos = Mensaje.buenos + '\n' + 'Ganador: ' + alumnoGanador.Nombre + ' ' + alumnoGanador.PrimerApellido + ' ' +
                                alumnoGanador.SegundoApellido;
              }
            } else {
              const numeroEnfrentamiento = indexEnfrentamientosConResultadosPreviamente[posicion] + 1;
              console.log('El enfrentamiento: ' + numeroEnfrentamiento + 'º tiene ganador');
              Mensaje.malos = Mensaje.malos + numeroEnfrentamiento + 'º ';
            }
          }
        } else {
          console.log('Se ha producido algún error: resultados.length !== enfrentamientosJornadaSeleccionada.length');
        }
        console.log('Mensaje.buenos');
        console.log(Mensaje.buenos);
        console.log('Mensaje.malos');
        console.log(Mensaje.malos);
        return Mensaje;
      });
    } else {
      // Saco todos los equipos de la BD para poder asociar el id del equipo ganador con un nombre de equipo
      this.peticionesAPI.DameEquipos()
      .subscribe(equipos => {
        if ( resultados.length === enfrentamientosJornadaSeleccionada.length) {
          for (let indexEnfrentamientos = 0; indexEnfrentamientos < enfrentamientosJornadaSeleccionada.length; indexEnfrentamientos++) {
            const posicion = indexEnfrentamientosConResultadosPreviamente.indexOf(indexEnfrentamientos);
            if (posicion === -1) { // si el enfrentamiento no está en el vector de enfrentamientos con resultados es mensaje bueno
              const numeroEnfrentamiento = indexEnfrentamientos + 1;
              console.log('numeroEnfrentamiento = ' + numeroEnfrentamiento);

              console.log('El enfrentamiento: ' + (indexEnfrentamientos + 1) + 'º no tiene ganadores');
              if (resultados[indexEnfrentamientos] === 0) {
                Mensaje.buenos = Mensaje.buenos + '\n' + 'Empate ';
              } else if (resultados[indexEnfrentamientos] === -1) {
                // enfrentamiento para el que no se ha seleccionado ganador
              } else {  // resultados[indexEnfrentamientos] === 1 || resultados[indexEnfrentamientos] === 2
                const equipoGanador = equipos.filter(alumno => alumno.id ===
                                                    enfrentamientosJornadaSeleccionada[indexEnfrentamientos].Ganador)[0];
                Mensaje.buenos = Mensaje.buenos + '\n' + 'Ganador: ' + equipoGanador.Nombre;
              }
            } else {
              const numeroEnfrentamiento = indexEnfrentamientosConResultadosPreviamente[posicion] + 1;
              console.log('El enfrentamiento: ' + numeroEnfrentamiento + 'º tiene ganador');
              Mensaje.malos = Mensaje.malos + numeroEnfrentamiento + 'º ';
            }
          }
        } else {
          console.log('Se ha producido algún error: resultados.length !== enfrentamientosJornadaSeleccionada.length');
        }
        console.log('Mensaje.buenos');
        console.log(Mensaje.buenos);
        console.log('Mensaje.malos');
        console.log(Mensaje.malos);
        return Mensaje;
      });
    }
  }



  //////////////////////////////////////// JUEGO DE COMPETICIÓN FÓRUMULA UNO ///////////////////////////////////
  // --------------------- Nueva metodología asignar ganadores  --------------------- //
  public AsignarResultadosJornadaF1(juego: Juego, jornada: Jornada, participantesPuntuan: number[]) {

    const puntuacionesDelJuego = juego.Puntos;
    if (participantesPuntuan.length === puntuacionesDelJuego.length) {
      console.log('ganadores.length === puntuacionesDelJuego.length');

      // Si la jornada no tenía ganadores (en principio tadas las jornadas que llegan a esta función es porque no tenían ganadores)
      // --> actualizar jornada con los ganadores seleccionados y actualizar puntos de los particupantes
      console.log('jornadaId: ' + jornada.id);
      console.log('ganador = ' + jornada.GanadoresFormulaUno);
      if (jornada.GanadoresFormulaUno === undefined) {

        // Actualizamos el ganador en JornadaDeCompeticionFormulaUno
        this.GuardarGanadorJornada(jornada, participantesPuntuan);

        // Actualizamos los puntos de los participantes
        for (let indexParticipantesPuntuan = 0; indexParticipantesPuntuan < participantesPuntuan.length; indexParticipantesPuntuan++) {

          this.ActualizarPuntosParticipantesJornada(juego, participantesPuntuan[indexParticipantesPuntuan],
                                                    puntuacionesDelJuego[indexParticipantesPuntuan]);
        }

      } else {  // el enfrentamiento tenía ganadores
        console.log('Esta jornada ya tiene ganadores asignados');
      }

      // // Mensaje sweetalert
      // const Mensaje = this.MensajeSweetalertF1();
    } else {
      console.log('Se ha producido algún error: participantesPuntuan.length !== puntuacionesDelJuego.length');
    }
  }

  GuardarGanadorJornada(jornada: Jornada, participantesPuntuan: number[]) {
    console.log('Actualizamos la Jornada');
    const jornadaActualizada: Jornada = jornada;
    console.log('jornada NO actualizada');
    console.log(jornadaActualizada);
    jornadaActualizada.GanadoresFormulaUno = participantesPuntuan;
    console.log('jornada actualizada');
    console.log(jornadaActualizada);
    this.peticionesAPI.PonGanadoresJornadasDeCompeticionFormulaUno(jornadaActualizada)
    .subscribe(res => {
      console.log(res);
      console.log('Se ha actualizado la jornada en la base de datos');
    });
  }

  ActualizarPuntosParticipantesJornada(juego: Juego, participantePuntua: number, puntuacionDelParticipantePuntua: number) {

    if (juego.Modo === 'Individual') {
      console.log('Estoy en ActualizarPuntosParticipantesJornada() Individual');
      let alumnoPuntua: AlumnoJuegoDeCompeticionFormulaUno;
      this.peticionesAPI.DameInscripcionesAlumnoJuegoDeCompeticionFormulaUno(juego.id)
      .subscribe(alumnosJuegoF1 => {
        console.log('alumnosJuegoF1');
        console.log(alumnosJuegoF1);
        console.log('participantePuntua');
        console.log(participantePuntua);
        alumnoPuntua = alumnosJuegoF1.filter(alumno => alumno.AlumnoId === participantePuntua)[0];
        console.log('alumnoGanador NO actualizado:');
        console.log(alumnoPuntua);
        alumnoPuntua.PuntosTotalesAlumno = alumnoPuntua.PuntosTotalesAlumno + puntuacionDelParticipantePuntua;
        console.log('alumnoGanador actualizado:');
        console.log(alumnoPuntua);
        this.peticionesAPI.PonPuntosAlumnoGanadorJornadasDeCompeticionFormulaUno(alumnoPuntua)
        .subscribe(res => console.log(res));
      });

    } else {
      console.log('Estoy en ActualizarPuntosParticipantesJornada() Individual');
      let equipoPuntua: EquipoJuegoDeCompeticionFormulaUno;
      this.peticionesAPI.DameInscripcionesEquipoJuegoDeCompeticionFormulaUno(juego.id)
      .subscribe(equiposJuegoF1 => {
        console.log('equiposJuegoF1');
        console.log(equiposJuegoF1);
        console.log('participantePuntua');
        console.log(participantePuntua);
        equipoPuntua = equiposJuegoF1.filter(alumno => alumno.EquipoId === participantePuntua)[0];
        console.log('equipoPuntua NO actualizado:');
        console.log(equipoPuntua);
        equipoPuntua.PuntosTotalesEquipo = equipoPuntua.PuntosTotalesEquipo + puntuacionDelParticipantePuntua;
        console.log('equipoPuntua actualizado:');
        console.log(equipoPuntua);
        this.peticionesAPI.PonPuntosEquipoGanadorJornadasDeCompeticionFormulaUno(equipoPuntua)
        .subscribe(res => console.log(res));
      });
    }
  }

  public JornadaF1TieneGanadores(jornadaId: number, jornadasDelJuego: Jornada[]) {
    let jornadaTieneGanadores = false;
    jornadasDelJuego.forEach(jornada => {
      if (jornada.id === Number(jornadaId) && jornada.GanadoresFormulaUno !== undefined) {
        jornadaTieneGanadores = true;
      }
    });
    console.log('jornadaTieneGanadore = ' + jornadaTieneGanadores);
    return jornadaTieneGanadores;
  }

  public ObtenerJornadaSeleccionada(jornadaId: number, jornadasDelJuego: Jornada[]) {
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < jornadasDelJuego.length; i++) {
      if (jornadasDelJuego[i].id === jornadaId) {
        return jornadasDelJuego[i];
      }
    }
  }

  public GanadoresMasivamenteNombre(lineas: string[], juegoSeleccionado: Juego) {
    let nombresClasificacion: string[] = [];
    let encontrado = false; // Detecta problema de línia en blanco y repetición de nombre
    let i = 0;
    while (i < lineas.length && encontrado === false) {
      const nombreClasificacion = lineas[i];
      const indexOfUnselected = nombresClasificacion.indexOf(nombreClasificacion);
      if (indexOfUnselected === -1 && nombreClasificacion !== '') {
        nombresClasificacion.push(nombreClasificacion);
      } else if (nombreClasificacion === '' && lineas.length === juegoSeleccionado.NumeroParticipantesPuntuan ||
                 nombreClasificacion === '' && i < juegoSeleccionado.NumeroParticipantesPuntuan ) {
        encontrado = true;
        nombresClasificacion = [];
        Swal.fire('Alguna de las líneas introducidas está en blanco', ' No se ha podido realizar esta acción', 'error');
      } else if (nombreClasificacion === '' && (i + 1) > juegoSeleccionado.NumeroParticipantesPuntuan) {
        console.log('linea: ' + (i + 1));
        // Si el espacio en blanco no está en una posición que puntúa no me importa porque antes de salir de la función irá fuera
        console.log('Hay líneas en blanco pero no en la posición de ganador. Este caso no me afecta');
      } else if (indexOfUnselected !== -1 && nombreClasificacion !== '') {
        encontrado = true;
        nombresClasificacion = [];
        console.log(i);
        console.log('Alguno de los participantes introducidos está repetido');
        Swal.fire('Alguno de los participantes introducidos está repetido', ' No se ha podido realizar esta acción', 'error');
      } else {
        encontrado = true;
        Swal.fire('se ha producido algún error', ' No se ha podido realizar esta acción', 'error');

      }
      i++;
    }
    const participantesPuntuan = juegoSeleccionado.NumeroParticipantesPuntuan;
    if (nombresClasificacion.length > participantesPuntuan) {
      let k = nombresClasificacion.length;
      while (k > participantesPuntuan) {
        nombresClasificacion.pop();
        k = k - 1;
      }
    }
    console.log('nombresClasificacion:');
    console.log(nombresClasificacion);
    return nombresClasificacion;
  }

  public GanadoresMasivamenteId(ganadoresNombre: string[], listaAlumnosClasificacion: TablaAlumnoJuegoDeCompeticion[],
                                listaEquiposClasificacion: TablaEquipoJuegoDeCompeticion[], juegoSeleccionado: Juego) {
    console.log('listaAlumnosClasificacion');
    console.log(listaAlumnosClasificacion);
    console.log('listaEquiposClasificacion');
    console.log(listaEquiposClasificacion);
    const numeroParticipantesPuntuan = juegoSeleccionado.NumeroParticipantesPuntuan;
    let participantesPuntuan: number[] = [];
    if (juegoSeleccionado.Modo === 'Individual') {
      // tslint:disable-next-line:prefer-for-of
      for (let i = 0; i < ganadoresNombre.length; i++) {
        let encontrado = false;
        // tslint:disable-next-line:prefer-for-of
        for (let j = 0; j < listaAlumnosClasificacion.length; j++) {
          if (ganadoresNombre[i] === listaAlumnosClasificacion[j].nombre + ' '
                                     + listaAlumnosClasificacion[j].primerApellido + ' '
                                     + listaAlumnosClasificacion[j].segundoApellido) {
            encontrado = true;
            console.log(ganadoresNombre[i] + '===' + listaAlumnosClasificacion[j].nombre + ' '
                                                   + listaAlumnosClasificacion[j].primerApellido + ' '
                                                   + listaAlumnosClasificacion[j].segundoApellido);
            if (participantesPuntuan.length < numeroParticipantesPuntuan) {
              participantesPuntuan.push(listaAlumnosClasificacion[j].id);
            }
          }
        }
        if (encontrado === false) {
          console.log('participantesPuntuan.length: ' + participantesPuntuan.length);
          console.log('Alguno de los nombres introducidos no se corresponde con ninguno de los alumnos del grupo');
          console.log(participantesPuntuan);
          // tslint:disable-next-line:max-line-length
          Swal.fire('Alguno de los nombres introducidos no se corresponde con ninguno de los equipos del grupo', ' No se ha podido realizar esta acción', 'error');
          participantesPuntuan = [];
        }
      }
      console.log(participantesPuntuan);
    } else {
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < ganadoresNombre.length; i++) {
          let encontrado = false;
          // tslint:disable-next-line:prefer-for-of
          for (let j = 0; j < listaEquiposClasificacion.length; j++) {
            if (ganadoresNombre[i] === listaEquiposClasificacion[j].nombre) {
              encontrado = true;
              if (participantesPuntuan.length < numeroParticipantesPuntuan) {
                participantesPuntuan.push(listaEquiposClasificacion[j].id);
              }
            }
          }
          if (encontrado === false) {
            console.log('participantesPuntuan.length = ' + participantesPuntuan.length);
            console.log('Alguno de los nombres introducidos no se corresponde con ninguno de los equipos del grupo');
            // tslint:disable-next-line:max-line-length
            Swal.fire('Alguno de los nombres introducidos no se corresponde con ninguno de los equipos del grupo', ' No se ha podido realizar esta acción', 'error');
            participantesPuntuan = [];
          }
        }
        console.log(participantesPuntuan);
    }
    return participantesPuntuan;
  }
  // ----------------------------------------------------------------------------- //


  public PrepararTablaRankingIndividualFormulaUno(listaAlumnosOrdenadaPorPuntos: AlumnoJuegoDeCompeticionFormulaUno[],
                                                  alumnosDelJuego: Alumno[]): TablaAlumnoJuegoDeCompeticion[] {
    const rankingJuegoDeCompeticion: TablaAlumnoJuegoDeCompeticion [] = [];
    console.log (' Vamos a preparar la tabla del ranking individual de Competición Fórmula Uno');
    console.log ('la lista de alumnos ordenada es: ');
    console.log (listaAlumnosOrdenadaPorPuntos);
    // tslint:disable-next-line:prefer-for-oF
    for (let i = 0; i < listaAlumnosOrdenadaPorPuntos.length; i++) {
    let alumno: Alumno;
    const alumnoId = listaAlumnosOrdenadaPorPuntos[i].AlumnoId;
    alumno = alumnosDelJuego.filter(res => res.id === alumnoId)[0];
    rankingJuegoDeCompeticion[i] = new TablaAlumnoJuegoDeCompeticion(i + 1, alumno.Nombre, alumno.PrimerApellido, alumno.SegundoApellido,
                            listaAlumnosOrdenadaPorPuntos[i].PuntosTotalesAlumno, alumnoId);
    }
    return rankingJuegoDeCompeticion;
}

  public PrepararTablaRankingEquipoFormulaUno(listaEquiposOrdenadaPorPuntos: EquipoJuegoDeCompeticionFormulaUno[],
                                              equiposDelJuego: Equipo[]) {
    const rankingJuegoDeCompeticion: TablaEquipoJuegoDeCompeticion [] = [];
    console.log (' Vamos a preparar la tabla del ranking por equipos de Competición Fórmula Uno');
    console.log ('la lista de equipos ordenada es: ');
    console.log (listaEquiposOrdenadaPorPuntos);
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < listaEquiposOrdenadaPorPuntos.length; i++) {
    let equipo: Equipo;
    const EquipoId = listaEquiposOrdenadaPorPuntos[i].EquipoId;
    equipo = equiposDelJuego.filter(res => res.id === EquipoId)[0];
    rankingJuegoDeCompeticion[i] = new TablaEquipoJuegoDeCompeticion(i + 1, equipo.Nombre,
                            listaEquiposOrdenadaPorPuntos[i].PuntosTotalesEquipo, EquipoId);
    }
    return rankingJuegoDeCompeticion;
  }

  public PrepararTablaRankingJornadaFormulaUno(datosClasificacionJornadaSeleccionada: {participante: string[];
                                                                                       puntos: number[];
                                                                                       posicion: number[];
                                                                                       participanteId: number[]}) {
    console.log('Estoy en PrepararTablaRankingJornadaFormulaUno');
    const rankingJornadaFormulaUno: TablaClasificacionJornada [] = [];
    for (let i = 0; i < datosClasificacionJornadaSeleccionada.participante.length; i++) {
      rankingJornadaFormulaUno[i] = new TablaClasificacionJornada(datosClasificacionJornadaSeleccionada.participante[i],
                                                                datosClasificacionJornadaSeleccionada.puntos[i],
                                                                datosClasificacionJornadaSeleccionada.posicion[i],
                                                                datosClasificacionJornadaSeleccionada.participanteId[i]);
    }
    return rankingJornadaFormulaUno;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  public DameRankingPuntoSeleccionadoEquipos(
    listaEquiposOrdenadaPorPuntos: any,
    equiposDelJuego: any,
    nivelesDelJuego: any,
    puntoSeleccionadoId: any
  ): any {

    const rankingObservable = new Observable ( obs => {

      let rankingEquiposJuegoDePuntos: any[] = [];
      // tslint:disable-next-line:prefer-for-of
      for (let i = 0; i < listaEquiposOrdenadaPorPuntos.length; i ++) {

        let equipo: Equipo;
        let nivel: Nivel;
        // Busca equipo
        equipo = equiposDelJuego.filter(res => res.id === listaEquiposOrdenadaPorPuntos[i].equipoId)[0];

        if (listaEquiposOrdenadaPorPuntos[i].nivelId !== undefined) {
          nivel = nivelesDelJuego.filter(res => res.id === listaEquiposOrdenadaPorPuntos[i].nivelId)[0];
        }

        this.peticionesAPI.DameHistorialDeUnPuntoEquipo(listaEquiposOrdenadaPorPuntos[i].id, puntoSeleccionadoId)
        .subscribe(historial => {

          let puntos = 0;
          // tslint:disable-next-line:prefer-for-of
          for (let j = 0; j < historial.length; j ++) {
            puntos = puntos + historial[j].ValorPunto;
          }


          if (nivel !== undefined) {
            rankingEquiposJuegoDePuntos[i] = new TablaEquipoJuegoDePuntos (i + 1, equipo.Nombre, equipo.id,
              puntos, nivel.Nombre);
          } else {
            rankingEquiposJuegoDePuntos[i] = new TablaEquipoJuegoDePuntos (i + 1, equipo.Nombre, equipo.id,
              puntos);
          }

          if (i === listaEquiposOrdenadaPorPuntos.length - 1 ) {
            // tslint:disable-next-line:only-arrow-functions
            rankingEquiposJuegoDePuntos = rankingEquiposJuegoDePuntos.sort(function(obj1, obj2) {
              return obj2.puntos - obj1.puntos;
            });
            obs.next (rankingEquiposJuegoDePuntos);
          }
        });
      }
    });
    return rankingObservable;
  }

  public DameRankingPuntoSeleccionadoAlumnos(
                            listaAlumnosOrdenadaPorPuntos: any,
                            alumnosDelJuego: any,
                            nivelesDelJuego: any,
                            puntoSeleccionadoId: any): any {
    const rankingObservable = new Observable ( obs => {

      let rankingJuegoDePuntos: any[] = [];

      console.log ('Dentro ranking2 ');
      console.log ('Recorremos los ' + listaAlumnosOrdenadaPorPuntos.length);
      // tslint:disable-next-line:prefer-for-of
      for (let i = 0; i < listaAlumnosOrdenadaPorPuntos.length; i ++) {
        console.log ('alumno ' + i);

        let alumno: Alumno;
        let nivel: Nivel;

        // Busco al alumno
        alumno = alumnosDelJuego.filter(res => res.id === listaAlumnosOrdenadaPorPuntos[i].alumnoId)[0];
        console.log ('nombre ' + alumno.Nombre);

        if (listaAlumnosOrdenadaPorPuntos[i].nivelId !== undefined) {
          console.log(listaAlumnosOrdenadaPorPuntos[i].alumnoId);
          // Busco el nivel
          nivel = nivelesDelJuego.filter(res => res.id === listaAlumnosOrdenadaPorPuntos[i].nivelId)[0];
        }

        this.peticionesAPI.DameHistorialDeUnPunto(listaAlumnosOrdenadaPorPuntos[i].id, puntoSeleccionadoId)
        .subscribe(historial => {
          let puntos = 0;
          console.log (alumno.Nombre + ' tieme ' + historial.length + 'asignaciones');
          // tslint:disable-next-line:prefer-for-of
          for (let j = 0; j < historial.length; j ++) {
            puntos = puntos + historial[j].ValorPunto;
          }
          console.log ('Puntos ' + puntos);

          if (nivel !== undefined) {
            // tslint:disable-next-line:max-line-length
            rankingJuegoDePuntos[i] = new TablaAlumnoJuegoDePuntos (i + 1, alumno.Nombre, alumno.PrimerApellido, alumno.SegundoApellido,
              puntos, nivel.Nombre);
          } else {
            // tslint:disable-next-line:max-line-length
            rankingJuegoDePuntos[i] = new TablaAlumnoJuegoDePuntos (i + 1, alumno.Nombre, alumno.PrimerApellido, alumno.SegundoApellido,
              puntos);
          }

          if (i === listaAlumnosOrdenadaPorPuntos.length - 1 ) {
            console.log ('vamos a acabar');
            // tslint:disable-next-line:only-arrow-functions
            rankingJuegoDePuntos = rankingJuegoDePuntos.sort(function(obj1, obj2) {
              return obj2.puntos - obj1.puntos;
            });
            obs.next (rankingJuegoDePuntos);
        }

        });
      }
    });
    return rankingObservable;
  }

  // ESTA FUNCIÓN NOS DA DOS LISTA, UNA CON LOS ALUMNOS DEL GRUPO CON EQUIPO Y
  // OTRA CON LOS QUE NO TIENEN EQUIPO
  public DameListasAlumnosConYSinEquipo(equipo: Equipo, alumnosGrupo: Alumno[]): any {
    const listasObservables = new Observable ( obs => {
      this.peticionesAPI.DameAsignacionesEquipoDelGrupo(equipo.grupoId)
      .subscribe(asignaciones => {
        console.log ('Asignaciones equipo ' + equipo.id);
        console.log (asignaciones);
        let asignacionesEquipo: any[];
        const alumnosConEquipo: Alumno[] = [];
        const alumnosSinEquipo: Alumno[] = [];

        if (asignaciones [0] !== undefined) {
          // cuando recibimos las asignaciones las metemos en su lista
          asignacionesEquipo = asignaciones;
        }
        console.log ('Alumnos del grupo: ' + alumnosGrupo);
        // Ahora preparamos dos listas, una de alumnos con equipo y otra de alumnos sin equipo
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < alumnosGrupo.length; i++) {

          // PRIMERO MIRAMOS SI HAY ALGUNA ASIGNACIÓN HECHA EN ESTE GRUPO O NO. SI NO HAY NINGUNA ASIGNACIÓN A NINGÚN EQUIPO HECHA
          // SIGNIFICA QUE TODOS LOS ALUMNOS DEL GRUPO PUEDEN METERSE EN CUALQUIER EQUIPO. SERÍA ILÓGICO BUSCAR EN ALGO VACÍO
          if (asignacionesEquipo != null) {
            // EN CASO DE TENER ASIGNADO UN EQUIPO (TRUE) LO INCLUIMOS EN LA LISTA DE ALUMNOS CON EQUIPO
            if (asignacionesEquipo.filter(res => res.alumnoId === alumnosGrupo[i].id)[0] !== undefined) {
              alumnosConEquipo.push(alumnosGrupo[i]);
              // SI NO ESTA ASIGNADO TODAVIDA A NINGÚN EQUIPO, LO PONEMOS EN LA LISTA DE ALUMNOS SIN EQUIPO
            } else  {
              alumnosSinEquipo.push(alumnosGrupo[i]);
            }
          // SI NO HAY NINGUNA ASIGNACIÓN HECHA SIGNIFICA QUE TODOS LOS ALUMNOS DEL GRUPO ESTAN SIN EQUIPO
          } else {
            alumnosSinEquipo.push(alumnosGrupo[i]);
          }
        }
        const resultado = { con: alumnosConEquipo, sin: alumnosSinEquipo};
        obs.next (resultado);
      });
    });
    console.log ('Id Equipo ' + equipo.id);
    return listasObservables;
  }

  public DameSiguienteNivel(nivelesDelJuego: Nivel[], nivel: Nivel): Nivel {
  // Retorna el nivel siguiente al que me dan, o undefined si el que me dan es el máximo
    const pos = nivelesDelJuego.indexOf (nivel);
    if (pos === nivelesDelJuego.length - 1) {
      return undefined;
    } else {
      return nivelesDelJuego[pos + 1];
    }
  }

  private DameNivelId( nivelesDelJuego: Nivel[], puntos: number): number {
  let i = 0;
  let encontrado = false;
  while ((i < nivelesDelJuego.length) && !encontrado) {
    if (nivelesDelJuego[i].PuntosAlcanzar > puntos) {
          encontrado = true;
          console.log ('encontrado');
    } else {
          i = i + 1;
    }
  }
  if (!encontrado) {
    console.log ('no encontrado');
    // Tiene el nivel máximo
    return nivelesDelJuego[nivelesDelJuego.length - 1].id;
  } else if (i > 0) {
    return nivelesDelJuego[i - 1].id;
  } else {
    return undefined;
  }
  }

// // Me da la posición que ocupa en el vector de niveles
// private DameNivelPos( nivelesDelJuego: Nivel[], puntos: number): number {
//   let i = 0;
//   let encontrado = false;
//   while ((i < nivelesDelJuego.length) && !encontrado) {
//     if (nivelesDelJuego[i].PuntosAlcanzar > puntos) {
//           encontrado = true;
//           console.log ('encontrado');
//     } else {
//           i = i + 1;
//     }
//   }
//   if (!encontrado) {
//     console.log ('no encontrado');
//     // Tiene el nivel máximo
//     return nivelesDelJuego.length - 1;
//   } else if (i > 0) {
//     return i - 1;
//   } else {
//     return undefined;
//   }
// }


  public BorrarPunto( punto: TablaHistorialPuntosAlumno, alumnoJuegoDePuntos: any,
                      nivelesDelJuego: Nivel[]) {

   alumnoJuegoDePuntos.PuntosTotalesAlumno = alumnoJuegoDePuntos.PuntosTotalesAlumno - punto.valorPunto;
   if ((nivelesDelJuego !== undefined) && (nivelesDelJuego.length !== 0)) {
     // calculamos el nuevo nivel
     console.log ('calculo nuevo nivel ' + nivelesDelJuego.length);
     const nivelId = this.DameNivelId (nivelesDelJuego, alumnoJuegoDePuntos.PuntosTotalesAlumno );
     alumnoJuegoDePuntos.nivelId = nivelId;
   }
   this.peticionesAPI.PonPuntosJuegoDePuntos(alumnoJuegoDePuntos, alumnoJuegoDePuntos.id).
   subscribe ();
   this.peticionesAPI.BorrarPuntosAlumno(punto.historialId).subscribe();
  }

  //  console.log ('EN calculos ' + alumnoSeleccionado.id);
  //  console.log ('EN calculos ' + alumnoJuegoDePuntos);
  //  const resultadoObservable = new Observable ( obs => {

  //   console.log(punto);
  //   this.peticionesAPI.BorrarPuntosAlumno(punto.historialId).subscribe();

  //   // Buscamos los nuevos puntos
  //   let nuevosPuntos: number;
  //   nuevosPuntos = (Number(alumnoJuegoDePuntos.PuntosTotalesAlumno) - Number(punto.valorPunto));
  //   console.log(nuevosPuntos);
  //   alumnoJuegoDePuntos.PuntosTotalesAlumno = nuevosPuntos;
  //   console.log('Borro los puntos y miro que puntos totales tengo');

  //   // Comprobamos si subimos de nivel o no
  //   // tslint:disable-next-line:curly
  //   if (nivel !== undefined) {
  //     if (nuevosPuntos < nivel.PuntosAlcanzar) {
  //       if (nivel !== undefined) {
  //         console.log('Voy a bajar de nivel');
  //         siguienteNivel = nivel;
  //         nivel = this.DameNivelAnterior(nivelesDelJuego, nivel.id);
  //       }

  //     } else {
  //       console.log('mantengo el nivel');
  //     }
  //   }
  //   console.log ('EN calculos ' + alumnoJuegoDePuntos);

  //   console.log('Voy a editar la base de datos y actualizar la tabla');
  //   if (nivel !== undefined) {
  //     this.peticionesAPI.PonPuntosJuegoDePuntos( new AlumnoJuegoDePuntos(alumnoSeleccionado.id, juegoSeleccionado.id,
  //       nuevosPuntos, nivel.id), alumnoJuegoDePuntos.id).subscribe(res => {
  //         console.log(res);
  //        // alumnoJuegoDePuntos = res;
  //         console.log ('EN calculos 1 ' + alumnoJuegoDePuntos);
  //         const resultado = {alumno: alumnoJuegoDePuntos, n: nivel, sn: siguienteNivel};
  //         obs.next (resultado);
  //    //     this.MostrarHistorialSeleccionado();
  //       });
  //   } else {
  //     this.peticionesAPI.PonPuntosJuegoDePuntos( new AlumnoJuegoDePuntos(alumnoSeleccionado.id, juegoSeleccionado.id,
  //       nuevosPuntos), alumnoJuegoDePuntos.id).subscribe(res => {
  //         console.log(res);
  //         console.log ('EN calculos 2 ' + alumnoJuegoDePuntos);
  //         const resultado = {alumno: alumnoJuegoDePuntos, n: nivel, sn: siguienteNivel};
  //         obs.next (resultado);
  //         //MostrarHistorialSeleccionado();
  //       });
  //   }
  //  });
  //  return resultadoObservable;

  // }

  public BorrarPuntoEquipo( punto: TablaHistorialPuntosEquipo, equipoJuegoDePuntos: any,
                            nivelesDelJuego: Nivel[]) {

      equipoJuegoDePuntos.PuntosTotalesEquipo = equipoJuegoDePuntos.PuntosTotalesEquipo - punto.valorPunto;
      if (nivelesDelJuego !== undefined) {
          // calculamos el nuevo nivel
          console.log ('calculo nuevo nivel ');
          const nivelId = this.DameNivelId (nivelesDelJuego, equipoJuegoDePuntos.PuntosTotalesEquipo );
          equipoJuegoDePuntos.nivelId = nivelId;
      }
      this.peticionesAPI.PonPuntosEquiposJuegoDePuntos(equipoJuegoDePuntos, equipoJuegoDePuntos.id).
      subscribe ();
      this.peticionesAPI.BorraPuntosEquipo(punto.historialId).subscribe();
  }

  // public BorrarPuntoEquipo2(
  //     equipoJuegoDePuntos: any,
  //     punto: TablaHistorialPuntosEquipo,
  //     nivel: any,
  //     siguienteNivel: any,
  //     juegoSeleccionado: any,
  //     equipoSeleccionado: any,
  //     nivelesDelJuego: any,
  //     ): any {
  //   const resultadoObservable = new Observable ( obs => {

  //     console.log(punto);

  //     // Buscamos los nuevos puntos
  //     let nuevosPuntos: number;
  //     nuevosPuntos = (Number(equipoJuegoDePuntos.PuntosTotalesEquipo) - Number(punto.valorPunto));
  //     console.log(nuevosPuntos);
  //     equipoJuegoDePuntos.PuntosTotalesEquipo = nuevosPuntos;

  //     this.peticionesAPI.BorraPuntosEquipo(punto.historialId).subscribe();



  //     console.log('Borro los puntos y miro que puntos totales tengo');

  //     // Comprobamos si subimos de nivel o no
  //     // tslint:disable-next-line:curly
  //     if (nivel !== undefined) {
  //       if (nuevosPuntos < nivel.PuntosAlcanzar) {
  //         if (nivel !== undefined) {
  //           console.log('Voy a bajar de nivel');
  //           siguienteNivel = nivel;
  //           nivel = this.DameNivelAnterior(nivelesDelJuego, nivel.id);
  //         }

  //       } else {
  //         console.log('mantengo el nivel');
  //       }
  //     }

  //     console.log('Voy a editar la base de datos y actualizar la tabla');
  //     if (nivel !== undefined) {
  //       this.peticionesAPI.PonPuntosEquiposJuegoDePuntos( new EquipoJuegoDePuntos(equipoSeleccionado.id,
  //         juegoSeleccionado.id, nuevosPuntos, nivel.id), equipoJuegoDePuntos.id).subscribe(res => {
  //           console.log(res);
  //           const resultado = {equipo: res, n: nivel, sn: siguienteNivel};
  //           obs.next (resultado);

  //         });
  //     } else {
  //       this.peticionesAPI.PonPuntosEquiposJuegoDePuntos( new EquipoJuegoDePuntos(equipoSeleccionado.id,
  //         juegoSeleccionado.id, nuevosPuntos), equipoJuegoDePuntos.id).subscribe(res => {
  //           console.log(res);
  //           const resultado = {equipo: res, n: nivel, sn: siguienteNivel};
  //           obs.next (resultado);
  //         });
  //     }
  //   });
  //   return resultadoObservable;

  // }



  // public DameNivelAnteriorRRRRRRR(nivelesDelJuego: any, nivelId: number): Nivel {

  //   // tslint:disable-next-line:no-inferrable-types
  //   let encontrado: boolean = false;
  //   let i = 0;
  //   while ((i < nivelesDelJuego.length) && (encontrado === false)) {

  //     if (nivelesDelJuego[i].id === nivelId) {
  //       encontrado = true;
  //     }
  //     i = i + 1;
  //   }
  //   if (i >= 2) {
  //     return nivelesDelJuego[i - 2];
  //     console.log('punto plata o mas');
  //   } else {
  //     return undefined;
  //     console.log('punto bronce');
  //   }

  // }
  // public PorcentajeEquipo(

  //   nivel: any,
  //   equipoJuegoDePuntos: any,
  //   nivelesDelJuego: any,
  //   siguienteNivel

  // ): number {

  //   let porcentaje: number;
  //   if (nivel !== undefined) {
  //     // Si no estoy en el útlimo nivel, busco el porcentaje. Sino el porcentaje es 1.
  //     if (equipoJuegoDePuntos.nivelId !== nivelesDelJuego[nivelesDelJuego.length - 1].id) {
  //       porcentaje = (equipoJuegoDePuntos.PuntosTotalesEquipo - nivel.PuntosAlcanzar) /
  //       (siguienteNivel.PuntosAlcanzar - nivel.PuntosAlcanzar);

  //     } else {
  //       porcentaje = 1;
  //     }

  //   } else {
  //     porcentaje = (equipoJuegoDePuntos.PuntosTotalesEquipo - 0) / (siguienteNivel.PuntosAlcanzar - 0);
  //   }

  //   return porcentaje;
  // }

  // public Porcentaje(nivel: any, siguienteNivel: any, alumnoJuegoDePuntos: any, nivelesDelJuego: any): number {

  //   let porcentaje: number;

  //   if (nivel !== undefined) {
  //     // Si no estoy en el útlimo nivel, busco el porcentaje. Sino el porcentaje es 1.
  //     if (alumnoJuegoDePuntos.nivelId !== nivelesDelJuego[nivelesDelJuego.length - 1].id) {
  //       porcentaje = (alumnoJuegoDePuntos.PuntosTotalesAlumno - nivel.PuntosAlcanzar) /
  //       (siguienteNivel.PuntosAlcanzar - nivel.PuntosAlcanzar);
  //       console.log('no estoy en el ultimo nivel');

  //     } else {
  //       porcentaje = 1;
  //     }

  //   } else {
  //     console.log('El sigueinte nivel es el primero');

  //     porcentaje = (alumnoJuegoDePuntos.PuntosTotalesAlumno - 0) / (siguienteNivel.PuntosAlcanzar - 0);
  //   }

  //   return porcentaje;
  // }

  // ESTA FUNCION DEVUELVE DOS LISTAS
  // NO ME GUSTA PORQUE LA DE RANKING INDIVIDUAL DEVUELVE SOLO UNA
  // HAY QUE PENSAR COMO SIMPLIFICAR ESTO DE LAS LISTAS Y LOS RANKINGS
  public PrepararTablaRankingEquipos(
    listaEquiposOrdenadaPorPuntos: any,
    equiposDelJuego: any,
    nivelesDelJuego: any,

  ): any {
  const rankingEquiposJuegoDePuntos: any[] = [];
  // const rankingEquiposJuegoDePuntosTotal: any [] = [];
  for (let i = 0; i < listaEquiposOrdenadaPorPuntos.length; i++) {
    console.log ('Bucle principal');
    let equipo: Equipo;
    let nivel: Nivel;
    equipo = equiposDelJuego.filter(res => res.id === listaEquiposOrdenadaPorPuntos[i].equipoId)[0];

    if (listaEquiposOrdenadaPorPuntos[i].nivelId !== undefined) {
      console.log(listaEquiposOrdenadaPorPuntos[i].equipoId);
      nivel = nivelesDelJuego.filter(res => res.id === listaEquiposOrdenadaPorPuntos[i].nivelId)[0];
      console.log(listaEquiposOrdenadaPorPuntos[i].nivelId);
    }

    if (nivel !== undefined) {
        rankingEquiposJuegoDePuntos[i] = new TablaEquipoJuegoDePuntos (i + 1, equipo.Nombre, equipo.id,
          listaEquiposOrdenadaPorPuntos[i].PuntosTotalesEquipo, nivel.Nombre);

        // rankingEquiposJuegoDePuntosTotal[i] = new TablaEquipoJuegoDePuntos (i + 1, equipo.Nombre, equipo.id,
        //     listaEquiposOrdenadaPorPuntos[i].PuntosTotalesEquipo, nivel.Nombre);
    } else {
        rankingEquiposJuegoDePuntos[i] = new TablaEquipoJuegoDePuntos (i + 1, equipo.Nombre, equipo.id,
            listaEquiposOrdenadaPorPuntos[i].PuntosTotalesEquipo);

        // rankingEquiposJuegoDePuntosTotal[i] = new TablaEquipoJuegoDePuntos (i + 1, equipo.Nombre, equipo.id,
        //     listaEquiposOrdenadaPorPuntos[i].PuntosTotalesEquipo);
    }
  }

  // const resultado = {
  //                       ranking: rankingEquiposJuegoDePuntos,
  //                       rankingTotal: rankingEquiposJuegoDePuntosTotal
  // };
  return rankingEquiposJuegoDePuntos;
}


  public AsignarPuntosAlumno(
    alumno: AlumnoJuegoDePuntos,
    nivelesDelJuego: Nivel[],
    puntosNuevos: any,
    puntoSeleccionadoId: any,
  ) {

        alumno.PuntosTotalesAlumno = alumno.PuntosTotalesAlumno + puntosNuevos;
        if (nivelesDelJuego.length > 0 ) {
          const nivelId = this.DameNivelId (nivelesDelJuego, alumno.PuntosTotalesAlumno );
          alumno.nivelId = nivelId;
        }
        this.peticionesAPI.PonPuntosJuegoDePuntos(alumno, alumno.id).
        subscribe ();
        const fechaAsignacionPunto = new Date();
        const fechaString = fechaAsignacionPunto.toLocaleDateString() + '  ' + fechaAsignacionPunto.toLocaleTimeString();
        // tslint:disable-next-line:max-line-length
        this.peticionesAPI.PonHistorialPuntosAlumno(new HistorialPuntosAlumno (puntosNuevos, puntoSeleccionadoId, alumno.id, fechaString))
            // tslint:disable-next-line:no-shadowed-variable
        .subscribe(res => console.log(res));
  }


  public AsignarPuntosEquipo(
    equipo: EquipoJuegoDePuntos,
    nivelesDelJuego: Nivel[],
    puntosNuevos: any,
    puntoSeleccionadoId: any,
  ) {

        equipo.PuntosTotalesEquipo = equipo.PuntosTotalesEquipo + puntosNuevos;
        if (nivelesDelJuego.length > 0 ) {
          const nivelId = this.DameNivelId (nivelesDelJuego, equipo.PuntosTotalesEquipo );
          equipo.nivelId = nivelId;
        }
        this.peticionesAPI.PonPuntosEquiposJuegoDePuntos(equipo, equipo.id).
        subscribe ();
        const fechaAsignacionPunto = new Date();
        const fechaString = fechaAsignacionPunto.toLocaleDateString() + '  ' + fechaAsignacionPunto.toLocaleTimeString();
        // tslint:disable-next-line:max-line-length
        this.peticionesAPI.PonHistorialPuntosEquipo(new HistorialPuntosEquipo (puntosNuevos, puntoSeleccionadoId, equipo.id, fechaString))
            // tslint:disable-next-line:no-shadowed-variable
        .subscribe(res => console.log(res));
  }


  public PreparaHistorialEquipo(
    equipoJuegoDePuntos: any,
    tiposPuntosDelJuego: any,
  ): any {
    const historialObservable = new Observable ( obs => {

      let historial = [];

      this.peticionesAPI.DameHistorialPuntosEquipo(equipoJuegoDePuntos.id)
      .subscribe(his => {

        if (his[0] !== null) {
          for (let i = 0; i < his.length; i++) {
            console.log('voy ' + i);
            const punto = tiposPuntosDelJuego.filter(res => res.id === his[i].puntoId)[0];

            historial[i] = new TablaHistorialPuntosEquipo (punto.Nombre,
            punto.Descripcion, his[i].ValorPunto, his[i].fecha,
            his[i].equipoJuegoDePuntosId, his[i].id, his[i].puntoId);
          }
        } else {
          historial = undefined;
        }
        historial = historial.filter(res => res.nombre !== '');
        obs.next (historial);
      });
    });
    return historialObservable;
  }


  public Prueba(profesorId): any {
    const gruposObservable = new Observable ( obs => {
        this.peticionesAPI.DameGruposProfesor(profesorId)
        .subscribe(res => {
          if (res[0] !== undefined) {
            obs.next (res.slice (0, 2));
          } else {
            obs.next (undefined);
          }
      });
    });
    return gruposObservable;
  }


  private randomIndex(
    probabilities: number[],
    randomGenerator: () => number = Math.random): number {

      // get the cumulative distribution function
      let acc = 0;
      const cdf = probabilities
          .map(v => acc += v) // running total [4,7,9,10]
          .map(v => v / acc); // normalize to max 1 [0.4,0.7,0.9,1]

      // pick a random number between 0 and 1
      const randomNumber = randomGenerator();

      // find the first index of cdf where it exceeds randomNumber
      // (findIndex() is in ES2015+)
      return cdf.findIndex(p => randomNumber < p);
  }

  public AsignarCromosAleatoriosAlumno(
    alumno: Alumno,
    inscripcionesAlumnos: any,
    numeroCromosRandom: number,
    probabilidadCromos: any,
    cromosColeccion: any,

  ) {
    let alumnoJuegoDeColeccion: AlumnoJuegoDeColeccion;
    alumnoJuegoDeColeccion = inscripcionesAlumnos.filter(res => res.alumnoId === alumno.id)[0];
    console.log(alumnoJuegoDeColeccion);

    // tslint:disable-next-line:prefer-const
    // let hits = this.probabilidadCromos.map(x => 0);


    for (let k = 0; k < numeroCromosRandom; k++) {

      console.log('Voy a hacer el post del cromo ' + k);

      const indexCromo = this.randomIndex(probabilidadCromos);
      // hits[this.indexCromo]++;


      this.peticionesAPI.AsignarCromoAlumno(new Album (alumnoJuegoDeColeccion.id,
        cromosColeccion[indexCromo].id)).subscribe(res => {

        // this.selection.clear();
        // this.selectionEquipos.clear();
        // this.isDisabled = true;
        // this.seleccionados = Array(this.alumnosDelJuego.length).fill(false);
      });
    }

  }

  public AsignarCromosAleatoriosEquipo(
      equipo: Equipo,
      inscripcionesEquipos: any,
      numeroCromosRandom: number,
      probabilidadCromos: any,
      cromosColeccion: any
  ) {
    let equipoJuegoDeColeccion: EquipoJuegoDeColeccion;
    equipoJuegoDeColeccion = inscripcionesEquipos.filter(res => res.equipoId === equipo.id)[0];
    console.log(equipoJuegoDeColeccion);

    for (let k = 0; k < numeroCromosRandom; k++) {

      console.log('Voy a hacer el post del cromo ' + k);

      const indexCromo = this.randomIndex(probabilidadCromos);

      this.peticionesAPI.AsignarCromoEquipo(new AlbumEquipo (equipoJuegoDeColeccion.id,
        cromosColeccion[indexCromo].id)).subscribe(res => {

        console.log(res);

      });
    }

  }

  // Esta función recibe una lista de cromos en la que puede haber repetidos
  // y geneera otra en la que cada cromo aparece una sola vez y se le asocia el número
  // de veces que aparece reperido en la lista de entrada
  GeneraListaSinRepetidos(listaCromos: Cromo []): any [] {
    const listaCromosSinRepetidos: any [] = [];
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < listaCromos.length; i++) {
      const n = listaCromos.filter (cromo => cromo.Nombre === listaCromos[i].Nombre).length;
      if (listaCromosSinRepetidos.filter (res => res.cromo.Nombre === listaCromos[i].Nombre).length === 0) {
        listaCromosSinRepetidos.push ({rep: n, cromo: listaCromos[i]});
      }
    }
    return listaCromosSinRepetidos;
  }

  public CrearJornadasLiga(NumeroDeJornadas, juegoDeCompeticionID): any [] {
    this.jornadasnuevas = [];
    for (let i = 0; i < NumeroDeJornadas; i++) {
      // tslint:disable-next-line:max-line-length '2000-01-01T01:01:01.000Z'
      const jornada = new Jornada(undefined, 'Pendiente de determinar', juegoDeCompeticionID);
      console.log(jornada);
      this.peticionesAPI.CrearJornadasLiga(jornada, juegoDeCompeticionID)
      .subscribe(jornadacreada => {
        console.log('jornada creada');
        console.log(jornadacreada);
        this.jornadasnuevas[i] = jornadacreada;
        });
    }
    return this.jornadasnuevas;
  }

  public CrearJornadasFormulaUno(NumeroDeJornadas, juegoDeCompeticionID): any [] {
    this.jornadasnuevas = [];
    for (let i = 0; i < NumeroDeJornadas; i++) {
      // tslint:disable-next-line:max-line-length '2000-01-01T01:01:01.000Z'
      const jornada = new Jornada(undefined, 'Pendiente de determinar', juegoDeCompeticionID);
      console.log(jornada);
      this.peticionesAPI.CrearJornadasFormulaUno(jornada, juegoDeCompeticionID)
      .subscribe(jornadacreada => {
        console.log('jornada creada');
        console.log(jornadacreada);
        this.jornadasnuevas[i] = jornadacreada;
        });
    }
    return this.jornadasnuevas;
  }

  public ObtenerNombreGanadoresFormulaUno(juegoSeleccionado: Juego, jornada, alumnoJuegoDeCompeticionFormulaUno,
                                          equipoJuegoDeCompeticionFormulaUno) {
    console.log('Estoy en ObtenerNombreGanadoresFormulaUno()');
    const GanadoresFormulaUno: {
      nombre: string[]
      id: number[]
    } = {nombre: [], id: []};
    GanadoresFormulaUno.nombre = [];
    GanadoresFormulaUno.id = jornada.GanadoresFormulaUno;
    if (juegoSeleccionado.Modo === 'Individual') {
      for (let j = 0; j < GanadoresFormulaUno.id.length; j++) {
        // tslint:disable-next-line:prefer-for-of
        for (let k = 0; k < alumnoJuegoDeCompeticionFormulaUno.length; k++) {
          if (GanadoresFormulaUno.id[j] === alumnoJuegoDeCompeticionFormulaUno[k].id) {
              GanadoresFormulaUno.nombre[j] = alumnoJuegoDeCompeticionFormulaUno[k].nombre + ' '
                                          + alumnoJuegoDeCompeticionFormulaUno[k].primerApellido + ' '
                                          + alumnoJuegoDeCompeticionFormulaUno[k].segundoApellido;
          }
        }
      }
      console.log(GanadoresFormulaUno);
      return GanadoresFormulaUno;
    } else {
      for (let j = 0; j < GanadoresFormulaUno.id.length; j++) {
        // tslint:disable-next-line:prefer-for-of
        for (let k = 0; k < equipoJuegoDeCompeticionFormulaUno.length; k++) {
          console.log('GanadoresFormulaUno[j].id === equipoJuegoDeCompeticionFormulaUno[k].id :');
          console.log(GanadoresFormulaUno.id[j] + '===' + equipoJuegoDeCompeticionFormulaUno[k].id);
          if (GanadoresFormulaUno.id[j] === equipoJuegoDeCompeticionFormulaUno[k].id) {
              GanadoresFormulaUno.nombre[j] = equipoJuegoDeCompeticionFormulaUno[k].nombre;
          }
        }
      }
      console.log('GanadoresFormulaUno:');
      console.log(GanadoresFormulaUno);
      return GanadoresFormulaUno;
    }
  }

  public ClasificacionJornada(juegoSeleccionado: Juego, alumnoJuegoDeCompeticionFormulaUno: TablaAlumnoJuegoDeCompeticion[],
                              equipoJuegoDeCompeticionFormulaUno: TablaEquipoJuegoDeCompeticion[], GanadoresFormulaUno: string[],
                              GanadoresFormulaUnoId: number[]) {
    if (GanadoresFormulaUno !== undefined) {
      const ParticipantesFormulaUno: string[] = GanadoresFormulaUno;
      const PuntosFormulaUno: number[] = [];
      juegoSeleccionado.Puntos.forEach(punto => { PuntosFormulaUno.push(punto); });
      // const PuntosFormulaUno: number[] = juegoSeleccionado.Puntos;
      const Posicion: number[] = [];
      const ParticipantesId: number[] = GanadoresFormulaUnoId;
      if (juegoSeleccionado.Modo === 'Individual') {
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < alumnoJuegoDeCompeticionFormulaUno.length; i++) {
          const ParticipanteFormulaUno = alumnoJuegoDeCompeticionFormulaUno[i].nombre + ' '
                                      + alumnoJuegoDeCompeticionFormulaUno[i].primerApellido + ' '
                                      + alumnoJuegoDeCompeticionFormulaUno[i].segundoApellido;
          const ParticipanteId = alumnoJuegoDeCompeticionFormulaUno[i].id;
          const indexNoGanador = GanadoresFormulaUno.indexOf(ParticipanteFormulaUno);
          if (indexNoGanador === -1) {
            ParticipantesFormulaUno.push(ParticipanteFormulaUno);
            PuntosFormulaUno.push(0);
            ParticipantesId.push(ParticipanteId);
          }
        }
        for (let j = 0; j < ParticipantesFormulaUno.length; j++) {
          Posicion[j] = j + 1;
        }
      } else {
        console.log('Estamos en ClasificacionJornada() equipo');
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < equipoJuegoDeCompeticionFormulaUno.length; i++) {
          const ParticipanteFormulaUno = equipoJuegoDeCompeticionFormulaUno[i].nombre;
          const ParticipanteId = equipoJuegoDeCompeticionFormulaUno[i].id;
          const indexNoGanador = GanadoresFormulaUno.indexOf(ParticipanteFormulaUno);
          if (indexNoGanador === -1) {
            ParticipantesFormulaUno.push(ParticipanteFormulaUno);
            PuntosFormulaUno.push(0);
            ParticipantesId.push(ParticipanteId);
          }
        }
        for (let j = 0; j < ParticipantesFormulaUno.length; j++) {
          Posicion[j] = j + 1;
        }
      }
      const datosClasificaciónJornada = {
        participante: ParticipantesFormulaUno,
        puntos: PuntosFormulaUno,
        posicion: Posicion,
        participanteId: ParticipantesId
      };
      return datosClasificaciónJornada;
    } else {
      console.log('Esta jornada aún no tiene ganadores asignados');
      const ParticipantesFormulaUno: string[] = [];
      const PuntosFormulaUno: number[] = [];
      const Posicion: number[] = [];
      const ParticipantesId: number[] = [];
      if (juegoSeleccionado.Modo === 'Individual') {
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < alumnoJuegoDeCompeticionFormulaUno.length; i++) {
          const ParticipanteFormulaUno = alumnoJuegoDeCompeticionFormulaUno[i].nombre + ' '
                                      + alumnoJuegoDeCompeticionFormulaUno[i].primerApellido + ' '
                                      + alumnoJuegoDeCompeticionFormulaUno[i].segundoApellido;
          ParticipantesFormulaUno.push(ParticipanteFormulaUno);
          const ParticipanteId = alumnoJuegoDeCompeticionFormulaUno[i].id;
          PuntosFormulaUno.push(0);
          ParticipantesId.push(ParticipanteId);
        }
        for (let j = 0; j < ParticipantesFormulaUno.length; j++) {
          Posicion[j] = j + 1;
        }
      } else {
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < equipoJuegoDeCompeticionFormulaUno.length; i++) {
          const ParticipanteFormulaUno = equipoJuegoDeCompeticionFormulaUno[i].nombre;
          ParticipantesFormulaUno.push(ParticipanteFormulaUno);
          const ParticipanteId = equipoJuegoDeCompeticionFormulaUno[i].id;
          PuntosFormulaUno.push(0);
          ParticipantesId.push(ParticipanteId);
        }
        for (let j = 0; j < ParticipantesFormulaUno.length; j++) {
          Posicion[j] = j + 1;
        }
      }
      const datosClasificaciónJornada = {
        participante: ParticipantesFormulaUno,
        puntos: PuntosFormulaUno,
        posicion: Posicion,
        participanteId: ParticipantesId
      };
      return datosClasificaciónJornada;
    }
  }

  public DameTablaJornadasCompeticion(juegoSeleccionado, jornadas, alumnoJuegoDeCompeticionFormulaUno,
                                      equipoJuegoDeCompeticionFormulaUno) {

    const TablaJornada: TablaJornadas [] = [];
    console.log('juego seleccionado:');
    console.log(juegoSeleccionado);
    for (let i = 0; i < juegoSeleccionado.NumeroTotalJornadas; i++) {
      let jornada: Jornada;
      const jornadaId = jornadas[i].id;
      jornada = jornadas.filter(res => res.id === jornadaId)[0];

      console.log('Ganadores de la jornada:');
      console.log(jornada.GanadoresFormulaUno);
      console.log('Fecha de la jornada');
      console.log(jornada.Fecha);
      if (juegoSeleccionado.Tipo === 'Juego De Competición Fórmula Uno') {

        if (jornada.Fecha === undefined && jornada.GanadoresFormulaUno === undefined) {
          const Disputada = false;
          TablaJornada[i] = new TablaJornadas (i + 1, jornada.Fecha, jornada.CriterioGanador, jornada.id, undefined, undefined, Disputada);

        } else if (jornada.Fecha === undefined && jornada.GanadoresFormulaUno !== undefined) {
          const GanadoresFormulaUno = this.ObtenerNombreGanadoresFormulaUno(juegoSeleccionado, jornada, alumnoJuegoDeCompeticionFormulaUno,
                                                                              equipoJuegoDeCompeticionFormulaUno);
          const Disputada = true;
          TablaJornada[i] = new TablaJornadas (i + 1, jornada.Fecha, jornada.CriterioGanador, jornada.id, GanadoresFormulaUno.nombre,
                                               GanadoresFormulaUno.id, Disputada);

          } else  if (jornada.Fecha !== undefined && jornada.GanadoresFormulaUno === undefined) {
            const Disputada = false;
            TablaJornada[i] = new TablaJornadas (i + 1, jornada.Fecha, jornada.CriterioGanador, jornada.id,
                                                 undefined, undefined, Disputada);

          } else {
            const GanadoresFormulaUno = this.ObtenerNombreGanadoresFormulaUno(juegoSeleccionado, jornada,
                                                                              alumnoJuegoDeCompeticionFormulaUno,
                                                                              equipoJuegoDeCompeticionFormulaUno);
            const Disputada = true;
            TablaJornada[i] = new TablaJornadas (i + 1, jornada.Fecha, jornada.CriterioGanador, jornada.id, GanadoresFormulaUno.nombre,
                                                GanadoresFormulaUno.id, Disputada);
          }
        }
    }
    return(TablaJornada);
  }

  public DameTablaJornadasLiga(juegoSeleccionado, jornadas, enfrentamientosJuego: EnfrentamientoLiga[][]) {
    const TablaJornada: TablaJornadas [] = [];
    console.log('juego seleccionado:');
    console.log(juegoSeleccionado);
    for (let i = 0; i < jornadas.length; i++) {
      let jornada: Jornada;
      const jornadaId = jornadas[i].id;
      jornada = jornadas.filter(res => res.id === jornadaId)[0];
      const enfrentamientosJornada: EnfrentamientoLiga[] = [];
      enfrentamientosJuego[i].forEach(enfrentamientoDeLaJornada => {
        if (enfrentamientoDeLaJornada.JornadaDeCompeticionLigaId === jornadaId) {
          enfrentamientosJornada.push(enfrentamientoDeLaJornada);
        }
      });
      console.log('Los enfrentamientosJornada con id ' + jornadaId + ' son:');
      console.log(enfrentamientosJornada);
      const Disputada: boolean = this.JornadaFinalizadaLiga(jornada, enfrentamientosJornada);
      TablaJornada[i] = new TablaJornadas (i + 1, jornada.Fecha, jornada.CriterioGanador, jornada.id, undefined, undefined, Disputada);
    }
    return TablaJornada;
  }

  public JornadaFinalizadaLiga(jornadaSeleccionada: Jornada, EnfrentamientosJornada: EnfrentamientoLiga[]) {
    let HayGanador = true;
    let jornadaFinalizada = true;
    if (jornadaSeleccionada.id === EnfrentamientosJornada[0].JornadaDeCompeticionLigaId) {
      // tslint:disable-next-line:prefer-for-of
      for (let i = 0; i < EnfrentamientosJornada.length; i++) {
        if (EnfrentamientosJornada[i].Ganador === undefined) {
          HayGanador = false;
        }
      }
      if (HayGanador === false) {
        jornadaFinalizada = false;
      }
    }
    return jornadaFinalizada;
  }

 public FormarEquiposAleatorios(individuos: any[], tamEquipos: number): any[] {
    const listaInicial = individuos;
    const numeroGrupos = Math.ceil(listaInicial.length / tamEquipos);
    console.log ('Tamaño ' + tamEquipos);

    console.log ('Numero de grupos ' + numeroGrupos);
    const equipos: any [] = [];
    for (let i = 0; i < numeroGrupos - 1; i++) {
      console.log ('grupo ' + i);
      const equipo: any[] = [];
      for (let j = 0; j < tamEquipos; j++) {
        const n = Math.floor(Math.random() * listaInicial.length);
        console.log (n + ' ' + listaInicial[n]);
        equipo.push (listaInicial[n]);
        listaInicial.splice (n , 1);
      }
      equipos.push (equipo);
    }
    equipos.push (listaInicial);
    return equipos;
  }

  public calcularLigaNumEquipos(numEquipos: number, numRondas: number): any[] {
    if (numEquipos % 2 !== 0) {
       numEquipos = numEquipos + 1;
     }
    const numParticupantes = numEquipos - 1;
    console.log('Vamos a crear los enfrentamientos');
    const numPartidosPorRonda = numEquipos / 2;

    this.rondas = [];

    console.log(this.rondas);
    for (let i = 0, k = 0; i < numRondas; i ++) {

      this.rondas[i] = [];

      for (let j = 0; j < numPartidosPorRonda; j ++) {

            this.rondas[i][j] = new EnfrentamientoLiga();
            this.rondas[i][j].JugadorUno = k;

            k ++;

            if (k === numParticupantes) {
                k = 0;
            }
        }
    }

    for (let i = 0; i < numRondas; i ++) {


        if (i % 2 === 0) {
            this.rondas[i][0].JugadorDos = numEquipos - 1;
        } else {
            this.rondas[i][0].JugadorDos = this.rondas[i][0].JugadorUno;
            this.rondas[i][0].JugadorUno = numEquipos - 1;
        }
    }

    const equipoMasAlto = numEquipos - 1;
    const equipoImparMasAlto = equipoMasAlto - 1;

    for (let i = 0, k = equipoImparMasAlto; i < numRondas; i ++) {


        for (let j = 1; j < numPartidosPorRonda; j ++) {
            this.rondas[i][j].JugadorDos = k;

            k --;

            if (k === -1) {
                k = equipoImparMasAlto;
            }
        }
    }
    console.log(this.rondas);
    return this.rondas;

  }

  public calcularLiga(numEquipos: number, NumeroDeJornadas: number, participantes: any, ID: number, Jornadas: Jornada[]) {
          console.log('Voy a por los enrentamientos');
          // let jornadas: Jornada[];
          // this.peticionesAPI.DameJornadasDeCompeticionLiga(ID)
          //   .subscribe(inscripciones => {
          //     jornadas = inscripciones;
          //     console.log('Las jornadas son: ');
          //     console.log(jornadas);
          //   });
          this.rondas = this.calcularLigaNumEquipos(participantes.length, NumeroDeJornadas);
          console.log('rondas');
          console.log(this.rondas);
          this.guardarenrentamientos(this.rondas, NumeroDeJornadas, participantes, Jornadas);
          console.log('Enrentaminetos guardados');
  }

  public guardarenrentamientos(rondas: Array<Array<EnfrentamientoLiga>>, NumeroDeJornadas: number,
                               participantes: any[], jornadas: Jornada[]) {

    const numPartidosPorRonda = participantes.length / 2;
    console.log(participantes.length);
    console.log('Muestro las jornadas');
    console.log(jornadas);
    console.log(jornadas[0].id);
    for (let i = 0; i < NumeroDeJornadas ; i ++) {


      for (let j = 0; j < numPartidosPorRonda; j ++) {
        // tslint:disable-next-line:prefer-const
        let EnfrentamientoLigaa: EnfrentamientoLiga;
        if (rondas[i][j].JugadorUno === participantes.length) {
          EnfrentamientoLigaa = new EnfrentamientoLiga(participantes[rondas[i][j].JugadorDos].id,
            participantes[rondas[i][j].JugadorDos].id, undefined, jornadas[i].id);

        } else if (rondas[i][j].JugadorDos === participantes.length) {
          EnfrentamientoLigaa = new EnfrentamientoLiga(participantes[rondas[i][j].JugadorUno].id,
            participantes[rondas[i][j].JugadorUno].id, undefined, jornadas[i].id);

        } else {
          EnfrentamientoLigaa = new EnfrentamientoLiga(participantes[rondas[i][j].JugadorUno].id,
            participantes[rondas[i][j].JugadorDos].id, undefined, jornadas[i].id);
        }
        console.log('mostramos enrentamiento');
        // console.log(EnfrentamientoLigaa);
        if (EnfrentamientoLigaa.JugadorUno !== EnfrentamientoLigaa.JugadorDos) {
          this.peticionesAPI.CrearEnrentamientoLiga(EnfrentamientoLigaa, jornadas[i].id)
          .subscribe(enfrentamientocreado => {
          console.log('enfrentamiento creado');
          console.log(enfrentamientocreado);
          });
        }
      }

    }
  }

  public DameTablaeditarPuntos(juegoSeleccionado: Juego) {
    this.TablaeditarPuntos = [];

    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < juegoSeleccionado.Puntos.length; i ++) {
      this.TablaeditarPuntos[i] = new TablaPuntosFormulaUno(i + 1, juegoSeleccionado.Puntos[i]);
    }
    return this.TablaeditarPuntos;
  }

  public JornadaFinalizada(juegoSeleccionado: Juego, jornadaSeleccionada: TablaJornadas) {
    let jornadaFinalizada = false;
    if (jornadaSeleccionada.Disputada === true) {
      jornadaFinalizada = true;
    }
    return jornadaFinalizada;
    // let jornadaFinalizada = false;
    // if (juegoSeleccionado.Tipo === 'Juego De Competición Liga') {
    //   if (jornadaSeleccionada.Disputada === true) {
    //     jornadaFinalizada = true;
    //   } else {
    //     jornadaFinalizada = false;
    //   }
    // } else if (juegoSeleccionado.Tipo === 'Juego De Competición Fórmula Uno') {
    //   if (jornadaSeleccionada.GanadoresFormulaUno.id === undefined &&
    //       jornadaSeleccionada.GanadoresFormulaUno.nombre === undefined) {
    //         jornadaFinalizada = false;
    //   } else {
    //     jornadaFinalizada = true;
    //   }
    // }
    // return jornadaFinalizada;
  }
}
